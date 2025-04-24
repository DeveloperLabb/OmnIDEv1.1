import matplotlib.pyplot as plt
import numpy as np

class ReportView:
    @staticmethod
    def generate_score_distribution(scores_df):
        # Generate histogram for score distribution
        plt.figure(figsize=(10, 6))
        plt.hist(scores_df['score'], bins=10, color='skyblue', edgecolor='black')
        plt.title('Score Distribution')
        plt.xlabel('Scores')
        plt.ylabel('Frequency')
        plt.grid(axis='y', linestyle='--', alpha=0.7)
        plt.savefig('score_distribution.png')
        plt.close()

    @staticmethod
    def generate_performance_graph(scores_df):
        # Calculate performance metrics
        scores_df['performance'] = np.where(scores_df['score'] >= 50, 'Pass', 'Fail')
        performance_counts = scores_df['performance'].value_counts()

        # Generate bar chart for performance
        plt.figure(figsize=(8, 5))
        performance_counts.plot(kind='bar', color=['green', 'red'])
        plt.title('Performance Overview')
        plt.xlabel('Performance')
        plt.ylabel('Number of Students')
        plt.xticks(rotation=0)
        plt.grid(axis='y', linestyle='--', alpha=0.7)
        plt.savefig('performance_overview.png')
        plt.close()
