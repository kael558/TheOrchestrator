import os
import boto3
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from datetime import datetime, timedelta
import warnings
from io import StringIO
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

# Set up plotting style
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

class LLMPerformanceAnalyzer:
    def __init__(self):
        """Initialize the analyzer with AWS S3 configuration"""
        self.s3_client = boto3.client('s3', region_name=os.getenv('AWS_REGION'))
        self.bucket = os.getenv('S3_BUCKET')
        self.key = os.getenv('S3_KEY', 'monitor_data.csv')
        self.df = None
        
    def load_data_from_s3(self):
        """Load monitoring data from S3"""
        try:
            print(f"📊 Loading data from S3: {self.bucket}/{self.key}")
            
            response = self.s3_client.get_object(Bucket=self.bucket, Key=self.key)
            csv_content = response['Body'].read().decode('utf-8')
            
            # Parse CSV data
            self.df = pd.read_csv(StringIO(csv_content))
            
            # Convert timestamp to datetime
            self.df['timestamp'] = pd.to_datetime(self.df['timestamp'])
            
            # Extract time components
            self.df['date'] = self.df['timestamp'].dt.date
            self.df['hour'] = self.df['timestamp'].dt.hour
            self.df['day_of_week'] = self.df['timestamp'].dt.day_name()
            self.df['day_of_week_num'] = self.df['timestamp'].dt.dayofweek
            
            # Convert numeric columns
            numeric_columns = ['latencyMs', 'responseLength', 'promptTokens', 'completionTokens', 'totalTokens']
            for col in numeric_columns:
                if col in self.df.columns:
                    self.df[col] = pd.to_numeric(self.df[col], errors='coerce')
            
            # Filter successful responses only
            self.df = self.df[self.df['success'] == True].copy()
            
            # Sort by timestamp for time series analysis
            self.df = self.df.sort_values('timestamp')
            
            print(f"✅ Loaded {len(self.df)} successful records")
            print(f"📅 Date range: {self.df['date'].min()} to {self.df['date'].max()}")
            print(f"🏷️  Unique prompts: {self.df['promptId'].nunique()}")
            print(f"🤖 Models: {', '.join(self.df['model'].unique())}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error loading data: {e}")
            return False
    
    def create_per_prompt_time_series(self):
        """Create linear plots showing latency over time for each prompt"""
        if self.df is None:
            print("❌ No data loaded. Please load data first.")
            return
        
        print("📊 Creating per-prompt time series analysis...")
        
        # Get unique prompts
        unique_prompts = self.df['promptId'].unique()
        num_prompts = len(unique_prompts)
        
        # Calculate grid layout - try to make it roughly square
        cols = min(2, num_prompts)  # Max 2 columns for readability
        rows = (num_prompts + cols - 1) // cols
        
        # Create figure with subplots
        fig, axes = plt.subplots(rows, cols, figsize=(20, 6*rows))
        fig.suptitle('Latency Over Time by Prompt', fontsize=20, fontweight='bold')
        
        # Handle case where we have only one subplot
        if num_prompts == 1:
            axes = [axes]
        elif rows == 1:
            axes = axes if isinstance(axes, np.ndarray) else [axes]
        else:
            axes = axes.flatten()
        
        # Color palette for different models
        model_colors = plt.cm.Set1(np.linspace(0, 1, len(self.df['model'].unique())))
        model_color_map = dict(zip(self.df['model'].unique(), model_colors))
        
        # Create a plot for each prompt
        for i, prompt_id in enumerate(unique_prompts):
            ax = axes[i]
            
            # Filter data for this prompt
            prompt_data = self.df[self.df['promptId'] == prompt_id].copy()
            
            # Group by model and plot each model's latency over time
            for model in prompt_data['model'].unique():
                model_data = prompt_data[prompt_data['model'] == model]
                
                ax.plot(model_data['timestamp'], model_data['latencyMs'], 
                       marker='o', linewidth=2, markersize=4, 
                       color=model_color_map[model], label=model, alpha=0.8)
            
            # Customize the subplot
            ax.set_title(f'Prompt: {prompt_id}', fontsize=14, fontweight='bold')
            ax.set_xlabel('Time')
            ax.set_ylabel('Latency (ms)')
            ax.grid(True, alpha=0.3)
            ax.legend()
            
            # Format x-axis to show time nicely
            ax.tick_params(axis='x', rotation=45)
            
            # Add trend line if there are enough points
            if len(prompt_data) > 3:
                # Calculate overall trend across all models
                x_numeric = pd.to_numeric(prompt_data['timestamp'])
                z = np.polyfit(x_numeric, prompt_data['latencyMs'], 1)
                p = np.poly1d(z)
                ax.plot(prompt_data['timestamp'], p(x_numeric), 
                       '--', color='red', alpha=0.7, linewidth=1, 
                       label=f'Trend (slope: {z[0]:.2e})')
            
            # Add statistics text
            stats_text = (f"Avg: {prompt_data['latencyMs'].mean():.1f}ms\n"
                         f"Std: {prompt_data['latencyMs'].std():.1f}ms\n"
                         f"Runs: {len(prompt_data)}")
            
            ax.text(0.02, 0.98, stats_text, transform=ax.transAxes, 
                   verticalalignment='top', bbox=dict(boxstyle='round', 
                   facecolor='wheat', alpha=0.8), fontsize=10)
        
        # Hide any unused subplots
        for i in range(num_prompts, len(axes)):
            axes[i].set_visible(False)
        
        plt.tight_layout()
        plt.savefig('per_prompt_latency_time_series.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print("✅ Per-prompt time series saved as 'per_prompt_latency_time_series.png'")
    
    def create_prompt_comparison_matrix(self):
        """Create a comprehensive comparison matrix for all prompts"""
        if self.df is None:
            print("❌ No data loaded. Please load data first.")
            return
        
        print("📊 Creating prompt comparison matrix...")
        
        # Calculate statistics for each prompt-model combination
        prompt_model_stats = self.df.groupby(['promptId', 'model']).agg({
            'latencyMs': ['mean', 'std', 'count'],
            'responseLength': 'mean',
            'totalTokens': 'mean'
        }).round(2)
        
        # Flatten column names
        prompt_model_stats.columns = ['_'.join(col).strip() for col in prompt_model_stats.columns]
        prompt_model_stats = prompt_model_stats.reset_index()
        
        # Create pivot table for latency heatmap
        latency_pivot = self.df.groupby(['promptId', 'model'])['latencyMs'].mean().unstack(fill_value=0)
        
        # Create figure with subplots
        fig, axes = plt.subplots(2, 2, figsize=(20, 16))
        fig.suptitle('Prompt Performance Comparison Matrix', fontsize=20, fontweight='bold')
        
        # 1. Latency heatmap
        sns.heatmap(latency_pivot, annot=True, fmt='.1f', cmap='YlOrRd', 
                   ax=axes[0, 0], cbar_kws={'label': 'Avg Latency (ms)'})
        axes[0, 0].set_title('Average Latency by Prompt and Model', fontsize=14, fontweight='bold')
        axes[0, 0].set_xlabel('Model')
        axes[0, 0].set_ylabel('Prompt ID')
        
        # 2. Response length heatmap
        response_pivot = self.df.groupby(['promptId', 'model'])['responseLength'].mean().unstack(fill_value=0)
        sns.heatmap(response_pivot, annot=True, fmt='.0f', cmap='Blues', 
                   ax=axes[0, 1], cbar_kws={'label': 'Avg Response Length (chars)'})
        axes[0, 1].set_title('Average Response Length by Prompt and Model', fontsize=14, fontweight='bold')
        axes[0, 1].set_xlabel('Model')
        axes[0, 1].set_ylabel('Prompt ID')
        
        # 3. Token usage heatmap
        tokens_pivot = self.df.groupby(['promptId', 'model'])['totalTokens'].mean().unstack(fill_value=0)
        sns.heatmap(tokens_pivot, annot=True, fmt='.0f', cmap='Greens', 
                   ax=axes[1, 0], cbar_kws={'label': 'Avg Total Tokens'})
        axes[1, 0].set_title('Average Token Usage by Prompt and Model', fontsize=14, fontweight='bold')
        axes[1, 0].set_xlabel('Model')
        axes[1, 0].set_ylabel('Prompt ID')
        
        # 4. Latency variability (coefficient of variation)
        latency_cv = self.df.groupby(['promptId', 'model'])['latencyMs'].agg(
            lambda x: x.std() / x.mean() if x.mean() > 0 else 0
        ).unstack(fill_value=0)
        sns.heatmap(latency_cv, annot=True, fmt='.2f', cmap='RdYlBu_r', 
                   ax=axes[1, 1], cbar_kws={'label': 'Latency CV'})
        axes[1, 1].set_title('Latency Variability (CV) by Prompt and Model', fontsize=14, fontweight='bold')
        axes[1, 1].set_xlabel('Model')
        axes[1, 1].set_ylabel('Prompt ID')
        
        plt.tight_layout()
        plt.savefig('prompt_comparison_matrix.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print("✅ Prompt comparison matrix saved as 'prompt_comparison_matrix.png'")
        
        return prompt_model_stats
    
    def create_hourly_analysis(self):
        """Create hourly pattern visualizations"""
        if self.df is None:
            print("❌ No data loaded. Please load data first.")
            return
        
        print("📊 Creating hourly analysis graphs...")
        
        # Create figure with subplots
        fig, axes = plt.subplots(2, 2, figsize=(20, 16))
        fig.suptitle('Hourly Performance Patterns', fontsize=20, fontweight='bold')
        
        # 1. Average Latency by Hour
        hourly_latency = self.df.groupby('hour')['latencyMs'].agg(['mean', 'std', 'count']).reset_index()
        
        axes[0, 0].bar(hourly_latency['hour'], hourly_latency['mean'], 
                      yerr=hourly_latency['std'], capsize=5, alpha=0.7, color='skyblue')
        axes[0, 0].set_title('Average Latency by Hour of Day', fontsize=16, fontweight='bold')
        axes[0, 0].set_xlabel('Hour of Day (24h format)')
        axes[0, 0].set_ylabel('Average Latency (ms)')
        axes[0, 0].grid(True, alpha=0.3)
        axes[0, 0].set_xticks(range(24))
        
        # Add value labels on bars
        for i, v in enumerate(hourly_latency['mean']):
            axes[0, 0].text(i, v + hourly_latency['std'].iloc[i], f'{v:.0f}ms', 
                           ha='center', va='bottom', fontsize=10)
        
        # 2. Average Response Length by Hour
        hourly_response = self.df.groupby('hour')['responseLength'].agg(['mean', 'std']).reset_index()
        
        axes[0, 1].bar(hourly_response['hour'], hourly_response['mean'], 
                      yerr=hourly_response['std'], capsize=5, alpha=0.7, color='lightcoral')
        axes[0, 1].set_title('Average Response Length by Hour of Day', fontsize=16, fontweight='bold')
        axes[0, 1].set_xlabel('Hour of Day (24h format)')
        axes[0, 1].set_ylabel('Average Response Length (characters)')
        axes[0, 1].grid(True, alpha=0.3)
        axes[0, 1].set_xticks(range(24))
        
        # Add value labels on bars
        for i, v in enumerate(hourly_response['mean']):
            axes[0, 1].text(i, v + hourly_response['std'].iloc[i], f'{v:.0f}', 
                           ha='center', va='bottom', fontsize=10)
        
        # 3. Latency Distribution by Hour (Box Plot)
        hourly_data_latency = [self.df[self.df['hour'] == h]['latencyMs'].values for h in range(24)]
        box_plot = axes[1, 0].boxplot(hourly_data_latency, patch_artist=True)
        
        # Color the boxes
        colors = plt.cm.viridis(np.linspace(0, 1, 24))
        for patch, color in zip(box_plot['boxes'], colors):
            patch.set_facecolor(color)
            patch.set_alpha(0.7)
        
        axes[1, 0].set_title('Latency Distribution by Hour', fontsize=16, fontweight='bold')
        axes[1, 0].set_xlabel('Hour of Day (24h format)')
        axes[1, 0].set_ylabel('Latency (ms)')
        axes[1, 0].grid(True, alpha=0.3)
        axes[1, 0].set_xticklabels(range(24))
        
        # 4. Response Length Distribution by Hour (Box Plot)
        hourly_data_response = [self.df[self.df['hour'] == h]['responseLength'].values for h in range(24)]
        box_plot_resp = axes[1, 1].boxplot(hourly_data_response, patch_artist=True)
        
        # Color the boxes
        for patch, color in zip(box_plot_resp['boxes'], colors):
            patch.set_facecolor(color)
            patch.set_alpha(0.7)
        
        axes[1, 1].set_title('Response Length Distribution by Hour', fontsize=16, fontweight='bold')
        axes[1, 1].set_xlabel('Hour of Day (24h format)')
        axes[1, 1].set_ylabel('Response Length (characters)')
        axes[1, 1].grid(True, alpha=0.3)
        axes[1, 1].set_xticklabels(range(24))
        
        plt.tight_layout()
        plt.savefig('hourly_performance_analysis.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print("✅ Hourly analysis saved as 'hourly_performance_analysis.png'")
    
    def create_daily_analysis(self):
        """Create daily pattern visualizations"""
        if self.df is None:
            print("❌ No data loaded. Please load data first.")
            return
        
        print("📊 Creating daily analysis graphs...")
        
        # Create figure with subplots
        fig, axes = plt.subplots(2, 2, figsize=(20, 16))
        fig.suptitle('Daily Performance Patterns', fontsize=20, fontweight='bold')
        
        # 1. Average Latency by Day of Week
        daily_latency = self.df.groupby(['day_of_week_num', 'day_of_week'])['latencyMs'].agg(['mean', 'std', 'count']).reset_index()
        daily_latency = daily_latency.sort_values('day_of_week_num')
        
        bars1 = axes[0, 0].bar(daily_latency['day_of_week'], daily_latency['mean'], 
                              yerr=daily_latency['std'], capsize=5, alpha=0.7, color='lightgreen')
        axes[0, 0].set_title('Average Latency by Day of Week', fontsize=16, fontweight='bold')
        axes[0, 0].set_xlabel('Day of Week')
        axes[0, 0].set_ylabel('Average Latency (ms)')
        axes[0, 0].grid(True, alpha=0.3)
        axes[0, 0].tick_params(axis='x', rotation=45)
        
        # Add value labels on bars
        for bar, v in zip(bars1, daily_latency['mean']):
            axes[0, 0].text(bar.get_x() + bar.get_width()/2, bar.get_height() + 50, f'{v:.0f}ms', 
                           ha='center', va='bottom', fontsize=10)
        
        # 2. Average Response Length by Day of Week
        daily_response = self.df.groupby(['day_of_week_num', 'day_of_week'])['responseLength'].agg(['mean', 'std']).reset_index()
        daily_response = daily_response.sort_values('day_of_week_num')
        
        bars2 = axes[0, 1].bar(daily_response['day_of_week'], daily_response['mean'], 
                              yerr=daily_response['std'], capsize=5, alpha=0.7, color='orange')
        axes[0, 1].set_title('Average Response Length by Day of Week', fontsize=16, fontweight='bold')
        axes[0, 1].set_xlabel('Day of Week')
        axes[0, 1].set_ylabel('Average Response Length (characters)')
        axes[0, 1].grid(True, alpha=0.3)
        axes[0, 1].tick_params(axis='x', rotation=45)
        
        # Add value labels on bars
        for bar, v in zip(bars2, daily_response['mean']):
            axes[0, 1].text(bar.get_x() + bar.get_width()/2, bar.get_height() + 20, f'{v:.0f}', 
                           ha='center', va='bottom', fontsize=10)
        
        # 3. Latency Over Time (Time Series)
        daily_time_series = self.df.groupby('date')['latencyMs'].agg(['mean', 'std']).reset_index()
        daily_time_series['date'] = pd.to_datetime(daily_time_series['date'])
        daily_time_series = daily_time_series.sort_values('date')
        
        axes[1, 0].plot(daily_time_series['date'], daily_time_series['mean'], 
                       marker='o', linewidth=2, markersize=6, color='purple')
        axes[1, 0].fill_between(daily_time_series['date'], 
                               daily_time_series['mean'] - daily_time_series['std'],
                               daily_time_series['mean'] + daily_time_series['std'],
                               alpha=0.3, color='purple')
        axes[1, 0].set_title('Latency Trend Over Time', fontsize=16, fontweight='bold')
        axes[1, 0].set_xlabel('Date')
        axes[1, 0].set_ylabel('Average Latency (ms)')
        axes[1, 0].grid(True, alpha=0.3)
        axes[1, 0].tick_params(axis='x', rotation=45)
        
        # 4. Response Length Over Time (Time Series)
        response_time_series = self.df.groupby('date')['responseLength'].agg(['mean', 'std']).reset_index()
        response_time_series['date'] = pd.to_datetime(response_time_series['date'])
        response_time_series = response_time_series.sort_values('date')
        
        axes[1, 1].plot(response_time_series['date'], response_time_series['mean'], 
                       marker='s', linewidth=2, markersize=6, color='brown')
        axes[1, 1].fill_between(response_time_series['date'], 
                               response_time_series['mean'] - response_time_series['std'],
                               response_time_series['mean'] + response_time_series['std'],
                               alpha=0.3, color='brown')
        axes[1, 1].set_title('Response Length Trend Over Time', fontsize=16, fontweight='bold')
        axes[1, 1].set_xlabel('Date')
        axes[1, 1].set_ylabel('Average Response Length (characters)')
        axes[1, 1].grid(True, alpha=0.3)
        axes[1, 1].tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        plt.savefig('daily_performance_analysis.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print("✅ Daily analysis saved as 'daily_performance_analysis.png'")
    
    def create_heatmaps(self):
        """Create heatmaps showing patterns across days and hours"""
        if self.df is None:
            print("❌ No data loaded. Please load data first.")
            return
        
        print("📊 Creating heatmap visualizations...")
        
        # Create figure with subplots
        fig, axes = plt.subplots(2, 2, figsize=(20, 16))
        fig.suptitle('Performance Heatmaps: Day vs Hour Patterns', fontsize=20, fontweight='bold')
        
        # Prepare data for heatmaps
        pivot_latency = self.df.groupby(['day_of_week', 'hour'])['latencyMs'].mean().unstack(fill_value=0)
        pivot_response = self.df.groupby(['day_of_week', 'hour'])['responseLength'].mean().unstack(fill_value=0)
        pivot_count = self.df.groupby(['day_of_week', 'hour'])['latencyMs'].count().unstack(fill_value=0)
        
        # Reorder days to start with Monday
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        pivot_latency = pivot_latency.reindex(day_order)
        pivot_response = pivot_response.reindex(day_order)
        pivot_count = pivot_count.reindex(day_order)
        
        # 1. Latency Heatmap
        sns.heatmap(pivot_latency, annot=True, fmt='.0f', cmap='YlOrRd', 
                   ax=axes[0, 0], cbar_kws={'label': 'Latency (ms)'})
        axes[0, 0].set_title('Average Latency by Day and Hour', fontsize=16, fontweight='bold')
        axes[0, 0].set_xlabel('Hour of Day')
        axes[0, 0].set_ylabel('Day of Week')
        
        # 2. Response Length Heatmap
        sns.heatmap(pivot_response, annot=True, fmt='.0f', cmap='Blues', 
                   ax=axes[0, 1], cbar_kws={'label': 'Response Length (chars)'})
        axes[0, 1].set_title('Average Response Length by Day and Hour', fontsize=16, fontweight='bold')
        axes[0, 1].set_xlabel('Hour of Day')
        axes[0, 1].set_ylabel('Day of Week')
        
        # 3. Request Count Heatmap
        sns.heatmap(pivot_count, annot=True, fmt='d', cmap='Greens', 
                   ax=axes[1, 0], cbar_kws={'label': 'Request Count'})
        axes[1, 0].set_title('Request Volume by Day and Hour', fontsize=16, fontweight='bold')
        axes[1, 0].set_xlabel('Hour of Day')
        axes[1, 0].set_ylabel('Day of Week')
        
        # 4. Latency Coefficient of Variation (CV) Heatmap
        pivot_latency_cv = self.df.groupby(['day_of_week', 'hour'])['latencyMs'].agg(
            lambda x: x.std() / x.mean() if x.mean() > 0 else 0
        ).unstack(fill_value=0)
        pivot_latency_cv = pivot_latency_cv.reindex(day_order)
        
        sns.heatmap(pivot_latency_cv, annot=True, fmt='.2f', cmap='RdYlBu_r', 
                   ax=axes[1, 1], cbar_kws={'label': 'Latency CV'})
        axes[1, 1].set_title('Latency Variability (Coefficient of Variation)', fontsize=16, fontweight='bold')
        axes[1, 1].set_xlabel('Hour of Day')
        axes[1, 1].set_ylabel('Day of Week')
        
        plt.tight_layout()
        plt.savefig('performance_heatmaps.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print("✅ Heatmaps saved as 'performance_heatmaps.png'")
    
    def create_model_comparison(self):
        """Create model comparison visualizations"""
        if self.df is None:
            print("❌ No data loaded. Please load data first.")
            return
        
        if 'model' not in self.df.columns or self.df['model'].nunique() < 2:
            print("⚠️ No model comparison available - need multiple models in data")
            return
        
        print("📊 Creating model comparison graphs...")
        
        # Create figure with subplots
        fig, axes = plt.subplots(2, 2, figsize=(20, 16))
        fig.suptitle('Model Performance Comparison', fontsize=20, fontweight='bold')
        
        # 1. Latency by Model and Hour
        model_hour_latency = self.df.groupby(['model', 'hour'])['latencyMs'].mean().unstack()
        model_hour_latency.plot(kind='bar', ax=axes[0, 0], width=0.8)
        axes[0, 0].set_title('Average Latency by Model and Hour', fontsize=16, fontweight='bold')
        axes[0, 0].set_xlabel('Model')
        axes[0, 0].set_ylabel('Average Latency (ms)')
        axes[0, 0].legend(title='Hour', bbox_to_anchor=(1.05, 1), loc='upper left')
        axes[0, 0].tick_params(axis='x', rotation=45)
        
        # 2. Response Length by Model and Hour
        model_hour_response = self.df.groupby(['model', 'hour'])['responseLength'].mean().unstack()
        model_hour_response.plot(kind='bar', ax=axes[0, 1], width=0.8)
        axes[0, 1].set_title('Average Response Length by Model and Hour', fontsize=16, fontweight='bold')
        axes[0, 1].set_xlabel('Model')
        axes[0, 1].set_ylabel('Average Response Length (chars)')
        axes[0, 1].legend(title='Hour', bbox_to_anchor=(1.05, 1), loc='upper left')
        axes[0, 1].tick_params(axis='x', rotation=45)
        
        # 3. Model Performance Distribution (Violin Plot)
        self.df.boxplot(column='latencyMs', by='model', ax=axes[1, 0])
        axes[1, 0].set_title('Latency Distribution by Model', fontsize=16, fontweight='bold')
        axes[1, 0].set_xlabel('Model')
        axes[1, 0].set_ylabel('Latency (ms)')
        plt.suptitle('')  # Remove automatic title
        
        # 4. Model Performance Distribution (Violin Plot)
        self.df.boxplot(column='responseLength', by='model', ax=axes[1, 1])
        axes[1, 1].set_title('Response Length Distribution by Model', fontsize=16, fontweight='bold')
        axes[1, 1].set_xlabel('Model')
        axes[1, 1].set_ylabel('Response Length (chars)')
        plt.suptitle('')  # Remove automatic title
        
        plt.tight_layout()
        plt.savefig('model_comparison_analysis.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print("✅ Model comparison saved as 'model_comparison_analysis.png'")
    
    def generate_summary_stats(self):
        """Generate and display summary statistics"""
        if self.df is None:
            print("❌ No data loaded. Please load data first.")
            return
        
        print("\n" + "="*80)
        print("📊 PERFORMANCE SUMMARY STATISTICS")
        print("="*80)
        
        # Overall statistics
        print(f"\n🔢 Overall Statistics:")
        print(f"   • Total successful requests: {len(self.df):,}")
        print(f"   • Date range: {self.df['date'].min()} to {self.df['date'].max()}")
        print(f"   • Unique prompts: {self.df['promptId'].nunique()}")
        print(f"   • Models tested: {', '.join(self.df['model'].unique())}")
        
        # Latency statistics
        print(f"\n⏱️ Latency Statistics:")
        print(f"   • Mean: {self.df['latencyMs'].mean():.2f} ms")
        print(f"   • Median: {self.df['latencyMs'].median():.2f} ms")
        print(f"   • Std Dev: {self.df['latencyMs'].std():.2f} ms")
        print(f"   • Min: {self.df['latencyMs'].min():.2f} ms")
        print(f"   • Max: {self.df['latencyMs'].max():.2f} ms")
        print(f"   • 95th percentile: {self.df['latencyMs'].quantile(0.95):.2f} ms")
        
        # Response length statistics
        print(f"\n📝 Response Length Statistics:")
        print(f"   • Mean: {self.df['responseLength'].mean():.2f} characters")
        print(f"   • Median: {self.df['responseLength'].median():.2f} characters")
        print(f"   • Std Dev: {self.df['responseLength'].std():.2f} characters")
        print(f"   • Min: {self.df['responseLength'].min():.0f} characters")
        print(f"   • Max: {self.df['responseLength'].max():.0f} characters")
        
        # Per-prompt statistics
        print(f"\n🏷️ Per-Prompt Statistics:")
        prompt_stats = self.df.groupby('promptId').agg({
            'latencyMs': ['mean', 'std', 'count'],
            'responseLength': 'mean'
        }).round(2)
        
        for prompt_id in self.df['promptId'].unique():
            mean_lat = prompt_stats.loc[prompt_id, ('latencyMs', 'mean')]
            std_lat = prompt_stats.loc[prompt_id, ('latencyMs', 'std')]
            count = prompt_stats.loc[prompt_id, ('latencyMs', 'count')]
            mean_resp = prompt_stats.loc[prompt_id, ('responseLength', 'mean')]
            print(f"   • {prompt_id}: {mean_lat:.1f}ms (±{std_lat:.1f}), {count} runs, {mean_resp:.0f} chars avg")
        
        # Peak hours analysis
        if len(self.df) > 0:
            hourly_stats = self.df.groupby('hour').agg({
                'latencyMs': ['mean', 'count'],
                'responseLength': 'mean'
            }).round(2)
            
            peak_latency_hour = hourly_stats[('latencyMs', 'mean')].idxmax()
            lowest_latency_hour = hourly_stats[('latencyMs', 'mean')].idxmin()
            
            print(f"\n🕐 Hourly Patterns:")
            print(f"   • Highest latency hour: {peak_latency_hour}:00 ({hourly_stats.loc[peak_latency_hour, ('latencyMs', 'mean')]:.2f} ms)")
            print(f"   • Lowest latency hour: {lowest_latency_hour}:00 ({hourly_stats.loc[lowest_latency_hour, ('latencyMs', 'mean')]:.2f} ms)")
        
        # Daily patterns
        if len(self.df) > 0:
            daily_stats = self.df.groupby('day_of_week').agg({
                'latencyMs': 'mean',
                'responseLength': 'mean'
            }).round(2)
            
            best_day = daily_stats['latencyMs'].idxmin()
            worst_day = daily_stats['latencyMs'].idxmax()
            
            print(f"\n📅 Daily Patterns:")
            print(f"   • Best performing day: {best_day} ({daily_stats.loc[best_day, 'latencyMs']:.2f} ms)")
            print(f"   • Worst performing day: {worst_day} ({daily_stats.loc[worst_day, 'latencyMs']:.2f} ms)")
        
        print("="*80)
    
    def run_full_analysis(self):
        """Run the complete analysis pipeline"""
        print("🚀 Starting comprehensive performance analysis...")
        
        # Load data
        if not self.load_data_from_s3():
            return False
        
        # Generate summary statistics
        self.generate_summary_stats()
        
        # Create all visualizations - starting with the new per-prompt time series
        self.create_per_prompt_time_series()
        self.create_prompt_comparison_matrix()
        self.create_hourly_analysis()
        self.create_daily_analysis()
        self.create_heatmaps()
        self.create_model_comparison()
        
        print("\n✅ Analysis complete! Generated files:")
        print("   • per_prompt_latency_time_series.png")
        print("   • prompt_comparison_matrix.png")
        print("   • hourly_performance_analysis.png")
        print("   • daily_performance_analysis.png")
        print("   • performance_heatmaps.png")
        print("   • model_comparison_analysis.png")
        
        return True

def main():
    """Main execution function"""
    analyzer = LLMPerformanceAnalyzer()
    
    try:
        success = analyzer.run_full_analysis()
        if success:
            print("\n🎉 All visualizations created successfully!")
        else:
            print("\n❌ Analysis failed. Please check your configuration and data.")
    except Exception as e:
        print(f"\n💥 Analysis failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()