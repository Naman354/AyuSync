class TriageResult {
  final String assessmentId;
  final String urgencyLevel; // ROUTINE, PRIORITY, URGENT
  final int urgencyScore; // 0 to 100
  final List<String> contributingFactors;
  final String recommendedAction;
  final String explanationText;
  final String? confirmedUrgency; // Worker confirmed or overridden
  final String? workerNotes;
  final double? confidence;

  TriageResult({
    required this.assessmentId,
    required this.urgencyLevel,
    required this.urgencyScore,
    required this.contributingFactors,
    required this.recommendedAction,
    required this.explanationText,
    this.confirmedUrgency,
    this.workerNotes,
    this.confidence,
  });

  factory TriageResult.fromBackendRecommendation(
    Map<String, dynamic> rec, {
    String? assessmentId,
    String? fallbackSymptom,
  }) {
    final urgency = rec['urgencyCategory']?.toString().toUpperCase() ?? 'ROUTINE';
    final conf = (rec['confidence'] as num?)?.toDouble() ?? 0.85;

    final reasonsList = <String>[];
    if (rec['reasons'] is List) {
      for (var r in (rec['reasons'] as List)) {
        reasonsList.add(r.toString());
      }
    } else if (rec['reasons'] is String) {
      reasonsList.add(rec['reasons'].toString());
    }

    int score = (conf * 100).round();
    if (urgency == 'URGENT') {
      score = score.clamp(75, 98);
    } else if (urgency == 'PRIORITY') {
      score = score.clamp(45, 74);
    } else {
      score = score.clamp(15, 44);
    }

    String action = 'Standard outpatient consultation at Sub-Centre / PHC.';
    if (urgency == 'URGENT') {
      action = 'Immediate stabilization and expedited referral to 24x7 PHC / CHC Emergency.';
    } else if (urgency == 'PRIORITY') {
      action = 'Same-day consultation at Primary Health Centre (PHC). Continuous vitals monitoring.';
    }

    final reasonStr = reasonsList.isNotEmpty
        ? reasonsList.join('; ')
        : 'AI clinical rules analyzed symptoms and physiological vital signs.';

    return TriageResult(
      assessmentId: assessmentId ?? rec['assessmentId']?.toString() ?? '',
      urgencyLevel: urgency,
      urgencyScore: score,
      contributingFactors: reasonsList.isNotEmpty ? reasonsList : ['Standard physiological metrics recorded'],
      recommendedAction: action,
      explanationText: reasonStr,
      confirmedUrgency: urgency,
      confidence: conf,
    );
  }

  TriageResult copyWith({
    String? confirmedUrgency,
    String? workerNotes,
    double? confidence,
  }) {
    return TriageResult(
      assessmentId: assessmentId,
      urgencyLevel: urgencyLevel,
      urgencyScore: urgencyScore,
      contributingFactors: contributingFactors,
      recommendedAction: recommendedAction,
      explanationText: explanationText,
      confirmedUrgency: confirmedUrgency ?? this.confirmedUrgency,
      workerNotes: workerNotes ?? this.workerNotes,
      confidence: confidence ?? this.confidence,
    );
  }
}
