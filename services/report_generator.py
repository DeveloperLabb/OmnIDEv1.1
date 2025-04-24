from models.report_model import ReportModel
from views.report_view import ReportView

class ReportGenerator:
    def __init__(self, db_connection_string):
        self.model = ReportModel(db_connection_string)
        self.view = ReportView()

    def generate_reports(self):
        scores_df = self.model.fetch_student_scores()
        self.view.generate_score_distribution(scores_df)
        self.view.generate_performance_graph(scores_df)

