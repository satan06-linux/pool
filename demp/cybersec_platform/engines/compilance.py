class ComplianceChecker:
    def check_gdpr_compliance(self, website):
        """GDPR compliance scanner"""
        checks = {
            'cookie_banner': False,
            'privacy_policy': False,
            'consent_mechanism': False
        }
        score = sum(checks.values()) / len(checks) * 100
        return {
            'compliance_score': score,
            'checks': checks,
            'recommendations': self._get_recommendations(score)
        }
    
    def _get_recommendations(self, score):
        if score > 80:
            return ['✅ GDPR compliant']
        elif score > 50:
            return ['Add cookie consent banner', 'Update privacy policy']
        else:
            return ['Full GDPR audit required', 'Implement consent management']