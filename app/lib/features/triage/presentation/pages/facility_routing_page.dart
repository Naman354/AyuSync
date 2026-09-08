import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/models/facility_model.dart';

class FacilityRoutingPage extends StatefulWidget {
  const FacilityRoutingPage({super.key});

  @override
  State<FacilityRoutingPage> createState() => _FacilityRoutingPageState();
}

class _FacilityRoutingPageState extends State<FacilityRoutingPage> {
  Facility? _selectedFacility;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final appState = Provider.of<AppState>(context, listen: false);
    if (appState.facilities.isNotEmpty) {
      _selectedFacility = appState.facilities.length > 1 ? appState.facilities[1] : appState.facilities.first;
    }
  }

  void _handleSubmitReferral() async {
    setState(() => _isSubmitting = true);
    final appState = Provider.of<AppState>(context, listen: false);
    if (_selectedFacility != null) {
      appState.selectFacility(_selectedFacility!);
    }
    await appState.submitReferralCaseAsync();

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    // Navigate to 15 Case Submitted as per Figma flow
    Navigator.pushReplacementNamed(context, '/triage/case_submitted');
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final facilities = appState.facilities;
    final urgency = appState.currentTriageResult?.confirmedUrgency ?? 'PRIORITY';

    // Ensure selection defaults if empty
    if (_selectedFacility == null && facilities.isNotEmpty) {
      _selectedFacility = facilities.first;
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Choose Health Facility'),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Header info banner
          Container(
            padding: const EdgeInsets.all(16.0),
            color: Colors.white,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.alt_route, color: Color(0xFF2563EB)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Recommended Centers for $urgency Urgency',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Centers sorted by distance, available doctors, and current waiting time.',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Facilities List
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(16.0),
              itemCount: facilities.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final fac = facilities[index];
                final isSelected = _selectedFacility?.id == fac.id;

                return Card(
                  elevation: 0,
                  color: isSelected ? Colors.blue.shade50.withValues(alpha: 0.5) : Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(
                      color: isSelected ? const Color(0xFF2563EB) : Colors.grey.shade300,
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(12),
                    onTap: () {
                      setState(() => _selectedFacility = fac);
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: isSelected ? const Color(0xFF2563EB) : Colors.blue.shade50,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(
                                  Icons.local_hospital,
                                  color: isSelected ? Colors.white : const Color(0xFF2563EB),
                                  size: 22,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      fac.name,
                                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${fac.type} • ${fac.distanceKm} km away',
                                      style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                width: 24,
                                height: 24,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: isSelected ? const Color(0xFF2563EB) : Colors.grey.shade400,
                                    width: 2,
                                  ),
                                ),
                                child: isSelected
                                    ? Center(
                                        child: Container(
                                          width: 12,
                                          height: 12,
                                          decoration: const BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: Color(0xFF2563EB),
                                          ),
                                        ),
                                      )
                                    : null,
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),

                          // Readiness & Capabilities Pills
                          Wrap(
                            spacing: 8,
                            runSpacing: 6,
                            children: [
                              _facilityBadge(
                                'Readiness: ${fac.readinessScore}%',
                                fac.readinessScore > 85 ? Colors.green : Colors.orange,
                              ),
                              if (fac.hasSpecialist)
                                _facilityBadge('👨‍⚕️ Specialist On Duty', Colors.blue),
                              if (fac.hasEmergency)
                                _facilityBadge('🚨 Emergency 24x7', Colors.red),
                              _facilityBadge('⏳ ~${fac.waitingMinutes}m Wait', Colors.grey.shade700),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Status: ${fac.freshness}',
                            style: TextStyle(fontSize: 11, color: Colors.grey.shade600, fontStyle: FontStyle.italic),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // Bottom Action Bar
          Container(
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: (_selectedFacility == null || _isSubmitting) ? null : _handleSubmitReferral,
              icon: _isSubmitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Icon(Icons.send_rounded),
              label: Flexible(
                child: Text(
                  _isSubmitting
                      ? 'Submitting Referral...'
                      : 'Send Patient Referral to ${_selectedFacility?.type ?? "Facility"}',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _facilityBadge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color),
      ),
    );
  }
}
