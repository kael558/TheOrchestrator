# LLM Performance Testing and Analysis

This directory contains tools for comprehensive testing and analysis of LLM API performance.

## Files Overview

### 📊 Core Testing Files

-   **`api_tester.js`** - Main monitoring script that tests various prompts across different models
-   **`qualitative_eval.js`** - Analyzes response quality patterns by hour and day
-   **`quantitative_eval.py`** - Creates comprehensive visualizations of performance metrics

### 📈 Analysis Capabilities

#### Quantitative Analysis (`quantitative_eval.py`)

The Python script provides comprehensive visual analysis of:

1. **Hourly Performance Patterns**

    - Average latency by hour of day
    - Response length variations throughout the day
    - Distribution analysis with box plots
    - Error bars showing standard deviation

2. **Daily Performance Patterns**

    - Performance by day of the week
    - Time series trends over multiple days
    - Day-to-day consistency analysis

3. **Heatmap Visualizations**

    - Day vs Hour performance matrix
    - Request volume patterns
    - Latency variability (coefficient of variation)

4. **Model Comparisons**
    - Performance differences between models
    - Model-specific hourly patterns
    - Distribution comparisons

## Setup and Usage

### Prerequisites

1. Python 3.8+ installed
2. AWS credentials configured
3. Environment variables set (see below)

### Installation

```bash
cd business-api/testing
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file with:

```env
AWS_REGION=your-aws-region
S3_BUCKET=your-s3-bucket
S3_KEY=monitor-v2.csv
OPENAI_API_KEY=your-openai-api-key
GROQ_API_KEY=your-groq-api-key
```

### Running the Analysis

#### Generate Performance Visualizations

```bash
python quantitative_eval.py
```

This will create:

-   `hourly_performance_analysis.png` - Hourly patterns
-   `daily_performance_analysis.png` - Daily patterns
-   `performance_heatmaps.png` - Day vs Hour heatmaps
-   `model_comparison_analysis.png` - Model comparisons

#### Run API Tests

```bash
node api_tester.js
```

#### Generate Qualitative Analysis

```bash
node qualitative_eval.js
```

## Output Files

### Generated Visualizations

1. **Hourly Performance Analysis**

    - Bar charts showing average latency and response length by hour
    - Box plots showing distribution patterns
    - Error bars indicating variability

2. **Daily Performance Analysis**

    - Weekly performance patterns
    - Time series trends
    - Day-of-week effects

3. **Performance Heatmaps**

    - Color-coded matrices showing performance across days and hours
    - Request volume visualization
    - Variability analysis

4. **Model Comparison**
    - Side-by-side model performance
    - Distribution comparisons
    - Hourly performance by model

### Analysis Reports

-   `hourly_pattern_analysis.json` - Detailed hourly quality analysis
-   `daily_pattern_analysis.json` - Daily pattern insights

## Key Metrics Analyzed

### Performance Metrics

-   **Latency (ms)** - Response time from request to completion
-   **Response Length** - Character count of generated responses
-   **Token Usage** - Prompt and completion token consumption
-   **Success Rate** - Percentage of successful requests

### Temporal Patterns

-   **Hourly Variations** - Performance changes throughout the day
-   **Daily Patterns** - Day-of-week effects on performance
-   **Time Series Trends** - Long-term performance evolution
-   **Peak/Off-Peak Analysis** - Identifying optimal usage times

## Insights Provided

### Performance Optimization

-   Identify peak performance hours
-   Detect performance degradation periods
-   Compare model efficiency
-   Analyze cost vs performance trade-offs

### Quality Assessment

-   Response consistency analysis
-   Error pattern identification
-   Quality variation by time
-   Model reliability comparison

### Operational Intelligence

-   Optimal scheduling recommendations
-   Resource allocation insights
-   Performance monitoring alerts
-   Capacity planning data

## Troubleshooting

### Common Issues

1. **AWS Access Denied** - Check your AWS credentials and S3 permissions
2. **No Data Found** - Ensure the S3 bucket and key are correct
3. **Missing Dependencies** - Run `pip install -r requirements.txt`
4. **API Rate Limits** - The scripts include delays to respect rate limits

### Data Requirements

-   Minimum 24 hours of data for meaningful hourly analysis
-   Multiple days of data for daily pattern analysis
-   Multiple models for comparison analysis

## Extending the Analysis

The codebase is designed to be extensible:

1. **Add New Metrics** - Modify the DataFrame processing in `quantitative_eval.py`
2. **Custom Visualizations** - Add new plotting functions to the analyzer class
3. **Additional Models** - Update the models array in `api_tester.js`
4. **New Prompts** - Add test scenarios to the prompts array

## Best Practices

1. **Regular Monitoring** - Run tests consistently to build historical data
2. **Multiple Models** - Test across different models for comparison
3. **Diverse Prompts** - Use varied prompt types to test different scenarios
4. **Data Retention** - Maintain historical data for trend analysis
