#!/usr/bin/env python3
"""
Demo script to test visualization functionality with sample data
This creates sample data that mimics the structure from your API testing
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import seaborn as sns
import random

# Set random seed for reproducible demo
np.random.seed(42)
random.seed(42)

def generate_sample_data():
    """Generate sample data that mimics your API testing structure"""
    
    # Sample prompts and models
    prompt_ids = ['feleenas-context-test', 'customer-greeting', 'financial-advisor', 'medical-qa']
    models = ['gpt-4o-mini', 'llama-3.3-70b-versatile']
    
    # Generate data for the last 7 days
    start_date = datetime.now() - timedelta(days=7)
    
    data = []
    
    for day in range(7):
        current_date = start_date + timedelta(days=day)
        
        # Generate 3-5 test runs per hour during business hours (8-20)
        for hour in range(8, 21):
            runs_this_hour = random.randint(2, 4)
            
            for run in range(runs_this_hour):
                for prompt_id in prompt_ids:
                    for model in models:
                        # Create realistic timestamp
                        minute = random.randint(0, 59)
                        second = random.randint(0, 59)
                        timestamp = current_date.replace(hour=hour, minute=minute, second=second)
                        
                        # Generate realistic latency based on model and time patterns
                        base_latency = 1500 if model == 'gpt-4o-mini' else 2200
                        
                        # Add hourly patterns (slower during peak hours)
                        hour_factor = 1.0
                        if 12 <= hour <= 14:  # Lunch peak
                            hour_factor = 1.3
                        elif 17 <= hour <= 19:  # Evening peak
                            hour_factor = 1.2
                        
                        # Add day-of-week patterns (slower on Mondays)
                        day_factor = 1.15 if current_date.weekday() == 0 else 1.0
                        
                        # Add some random variation
                        noise_factor = random.uniform(0.7, 1.4)
                        
                        latency = int(base_latency * hour_factor * day_factor * noise_factor)
                        
                        # Generate response length based on prompt type
                        base_length = {
                            'feleenas-context-test': 150,
                            'customer-greeting': 80,
                            'financial-advisor': 300,
                            'medical-qa': 250
                        }[prompt_id]
                        
                        response_length = int(base_length * random.uniform(0.6, 1.8))
                        
                        # Token calculations (simplified)
                        prompt_tokens = random.randint(100, 500)
                        completion_tokens = response_length // 4  # Rough estimate
                        total_tokens = prompt_tokens + completion_tokens
                        
                        record = {
                            'timestamp': timestamp.isoformat(),
                            'promptId': prompt_id,
                            'model': model,
                            'latencyMs': latency,
                            'success': True,  # Assume all successful for demo
                            'finishReason': 'stop',
                            'promptTokens': prompt_tokens,
                            'completionTokens': completion_tokens,
                            'totalTokens': total_tokens,
                            'responseLength': response_length,
                            'response': f"Sample response for {prompt_id}...",
                        }
                        
                        data.append(record)
    
    return pd.DataFrame(data)

class DemoAnalyzer:
    """Simplified version of the analyzer for demo purposes"""
    
    def __init__(self, df):
        self.df = df.copy()
        
        # Convert timestamp to datetime
        self.df['timestamp'] = pd.to_datetime(self.df['timestamp'])
        
        # Extract time components
        self.df['date'] = self.df['timestamp'].dt.date
        self.df['hour'] = self.df['timestamp'].dt.hour
        self.df['day_of_week'] = self.df['timestamp'].dt.day_name()
        self.df['day_of_week_num'] = self.df['timestamp'].dt.dayofweek
    
    def create_demo_visualizations(self):
        """Create demo visualizations"""
        
        print("📊 Creating demo visualizations...")
        
        # Set up plotting style
        plt.style.use('seaborn-v0_8')
        sns.set_palette("husl")
        
        # Create comprehensive figure
        fig, axes = plt.subplots(2, 3, figsize=(24, 16))
        fig.suptitle('LLM Performance Analysis - Demo Visualization', fontsize=20, fontweight='bold')
        
        # 1. Hourly Latency Pattern
        hourly_latency = self.df.groupby('hour')['latencyMs'].agg(['mean', 'std']).reset_index()
        
        axes[0, 0].bar(hourly_latency['hour'], hourly_latency['mean'], 
                      yerr=hourly_latency['std'], capsize=5, alpha=0.7, color='skyblue')
        axes[0, 0].set_title('Average Latency by Hour of Day', fontsize=14, fontweight='bold')
        axes[0, 0].set_xlabel('Hour of Day')
        axes[0, 0].set_ylabel('Latency (ms)')
        axes[0, 0].grid(True, alpha=0.3)
        
        # Add value labels
        for i, v in enumerate(hourly_latency['mean']):
            axes[0, 0].text(i, v + 50, f'{v:.0f}', ha='center', va='bottom', fontsize=9)
        
        # 2. Daily Latency Pattern
        daily_latency = self.df.groupby(['day_of_week_num', 'day_of_week'])['latencyMs'].mean().reset_index()
        daily_latency = daily_latency.sort_values('day_of_week_num')
        
        axes[0, 1].bar(daily_latency['day_of_week'], daily_latency['mean'], 
                      alpha=0.7, color='lightcoral')
        axes[0, 1].set_title('Average Latency by Day of Week', fontsize=14, fontweight='bold')
        axes[0, 1].set_xlabel('Day of Week')
        axes[0, 1].set_ylabel('Latency (ms)')
        axes[0, 1].tick_params(axis='x', rotation=45)
        axes[0, 1].grid(True, alpha=0.3)
        
        # 3. Model Comparison
        model_comparison = self.df.groupby('model')['latencyMs'].agg(['mean', 'std']).reset_index()
        
        axes[0, 2].bar(model_comparison['model'], model_comparison['mean'], 
                      yerr=model_comparison['std'], capsize=5, alpha=0.7, color='lightgreen')
        axes[0, 2].set_title('Average Latency by Model', fontsize=14, fontweight='bold')
        axes[0, 2].set_xlabel('Model')
        axes[0, 2].set_ylabel('Latency (ms)')
        axes[0, 2].tick_params(axis='x', rotation=45)
        axes[0, 2].grid(True, alpha=0.3)
        
        # 4. Response Length by Hour
        hourly_response = self.df.groupby('hour')['responseLength'].mean().reset_index()
        
        axes[1, 0].plot(hourly_response['hour'], hourly_response['responseLength'], 
                       marker='o', linewidth=2, markersize=6, color='purple')
        axes[1, 0].set_title('Response Length by Hour', fontsize=14, fontweight='bold')
        axes[1, 0].set_xlabel('Hour of Day')
        axes[1, 0].set_ylabel('Response Length (chars)')
        axes[1, 0].grid(True, alpha=0.3)
        
        # 5. Latency Distribution
        self.df.boxplot(column='latencyMs', by='model', ax=axes[1, 1])
        axes[1, 1].set_title('Latency Distribution by Model', fontsize=14, fontweight='bold')
        axes[1, 1].set_xlabel('Model')
        axes[1, 1].set_ylabel('Latency (ms)')
        plt.suptitle('')  # Remove automatic title
        
        # 6. Heatmap - Day vs Hour
        pivot_data = self.df.groupby(['day_of_week', 'hour'])['latencyMs'].mean().unstack(fill_value=0)
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        pivot_data = pivot_data.reindex(day_order)
        
        sns.heatmap(pivot_data, annot=True, fmt='.0f', cmap='YlOrRd', 
                   ax=axes[1, 2], cbar_kws={'label': 'Latency (ms)'})
        axes[1, 2].set_title('Latency Heatmap: Day vs Hour', fontsize=14, fontweight='bold')
        axes[1, 2].set_xlabel('Hour of Day')
        axes[1, 2].set_ylabel('Day of Week')
        
        plt.tight_layout()
        plt.savefig('demo_performance_analysis.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print("✅ Demo visualization saved as 'demo_performance_analysis.png'")
        
        # Print summary statistics
        self.print_demo_summary()
    
    def print_demo_summary(self):
        """Print demo summary statistics"""
        print("\n" + "="*60)
        print("📊 DEMO PERFORMANCE SUMMARY")
        print("="*60)
        
        print(f"\n🔢 Dataset Overview:")
        print(f"   • Total records: {len(self.df):,}")
        print(f"   • Date range: {self.df['date'].min()} to {self.df['date'].max()}")
        print(f"   • Prompts tested: {', '.join(self.df['promptId'].unique())}")
        print(f"   • Models: {', '.join(self.df['model'].unique())}")
        
        print(f"\n⏱️ Latency Insights:")
        print(f"   • Average: {self.df['latencyMs'].mean():.0f} ms")
        print(f"   • Range: {self.df['latencyMs'].min():.0f} - {self.df['latencyMs'].max():.0f} ms")
        
        # Find peak hours
        hourly_avg = self.df.groupby('hour')['latencyMs'].mean()
        peak_hour = hourly_avg.idxmax()
        best_hour = hourly_avg.idxmin()
        
        print(f"   • Slowest hour: {peak_hour}:00 ({hourly_avg[peak_hour]:.0f} ms)")
        print(f"   • Fastest hour: {best_hour}:00 ({hourly_avg[best_hour]:.0f} ms)")
        
        # Model comparison
        model_avg = self.df.groupby('model')['latencyMs'].mean()
        print(f"\n🤖 Model Performance:")
        for model, avg_latency in model_avg.items():
            print(f"   • {model}: {avg_latency:.0f} ms average")
        
        print("="*60)

def main():
    """Run the demo visualization"""
    print("🚀 Starting LLM Performance Analysis Demo...")
    print("📊 Generating sample data...")
    
    # Generate sample data
    sample_df = generate_sample_data()
    print(f"✅ Generated {len(sample_df)} sample records")
    
    # Create analyzer and run demo
    analyzer = DemoAnalyzer(sample_df)
    analyzer.create_demo_visualizations()
    
    print("\n🎉 Demo complete! This shows what your real analysis will look like.")
    print("📁 To use with real data, run: python quantitative_eval.py")

if __name__ == "__main__":
    main()
