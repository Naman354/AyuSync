import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/state/app_state.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/models/facility_model.dart';

class FacilityRoutingPage extends StatefulWidget {
  const FacilityRoutingPage({super.key});

  @override
  State<FacilityRoutingPage> createState() => _FacilityRoutingPageState();
}

class _FacilityRoutingPageState extends State<FacilityRoutingPage> {
  Facility? _selectedFacility;
  bool _needsAmbulance = false;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final appState = Provider.of<AppState>(context, listen: false);
    if (appState.facilities.length > 1) {
      _selectedFacility = appState.facilities[1]; // Default to PHC
    } else if (appState.facilities.isNotEmpty) {
      _selectedFacility = appState.facilities.first;
    }

    // Auto-suggest ambulance if critical
    final urgency = appState.currentTriageResult?.confirmedUrgency?.toUpperCase() ?? '';
    if (urgency == 'EMERGENCY' || urgency == 'CRITICAL') {
      _needsAmbulance = true;
    }
  }

  void _handleSubmitReferral() async {
    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);

    final appState = Provider.of<AppState>(context, listen: false);
    if (_selectedFacility != null) {
      appState.selectFacility(_selectedFacility!);
    }
    appState.submitReferralCase(needsAmbulance: _needsAmbulance);

    await Future.delayed(const Duration(milliseconds: 350));
    if (!mounted) return;

    // Navigate to Case Submitted page
    Navigator.pushReplacementNamed(context, '/triage/case_submitted');
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final facilities = appState.facilities;
    final urgency = appState.currentTriageResult?.confirmedUrgency ?? 'PRIORITY';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(appState.translate('smart_routing_title'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.forest,
        elevation: 0,
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
                    const Icon(Icons.alt_route_rounded, color: AppColors.forest),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        appState.translate('routing_match_title', args: {'level': urgency}),
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textDark),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  appState.translate('routing_ranking_desc'),
                  style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE5E7EB)),

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
                  color: isSelected ? const Color(0xFFF0FDF4) : Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: BorderSide(
                      color: isSelected ? AppColors.forest : const Color(0xFFE5E7EB),
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(14),
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
                                  color: isSelected ? AppColors.forest : AppColors.mintLight,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(
                                  Icons.local_hospital_rounded,
                                  color: isSelected ? Colors.white : AppColors.forest,
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
                                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textDark),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${fac.type} • ${appState.translate('distance_km_away', args: {'distance': '${fac.distanceKm}'})}',
                                      style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                                    ),
                                  ],
                                ),
                              ),
                              Icon(
                                isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                                color: isSelected ? AppColors.forest : Colors.grey,
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
                                appState.translate('readiness_badge', args: {'score': '${fac.readinessScore}'}),
                                fac.readinessScore > 85 ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                              ),
                              if (fac.hasSpecialist)
                                _facilityBadge(appState.translate('specialist_on_duty'), const Color(0xFF0284C7)),
                              if (fac.hasEmergency)
                                _facilityBadge(appState.translate('emergency_24x7'), const Color(0xFFDC2626)),
                              _facilityBadge(appState.translate('wait_time_mins', args: {'minutes': '${fac.waitingMinutes}'}), const Color(0xFF4B5563)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            appState.translate('freshness_label', args: {'freshness': fac.freshness}),
                            style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF), fontStyle: FontStyle.italic),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // 108 Emergency Ambulance Toggle Card
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.white,
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: _needsAmbulance ? const Color(0xFFFEF2F2) : const Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        Icons.airport_shuttle_rounded,
                        color: _needsAmbulance ? const Color(0xFFDC2626) : const Color(0xFF6B7280),
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            appState.translate('ambulance_request_title'),
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textDark),
                          ),
                          Text(
                            appState.translate('ambulance_request_desc'),
                            style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                          ),
                        ],
                      ),
                    ),
                    Switch(
                      value: _needsAmbulance,
                      activeThumbColor: const Color(0xFFDC2626),
                      onChanged: (val) => setState(() => _needsAmbulance = val),
                    ),
                  ],
                ),
                if (_needsAmbulance) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFFDE68A)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline, size: 14, color: Color(0xFFD97706)),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            appState.translate('ambulance_gps_notice'),
                            style: const TextStyle(fontSize: 11, color: Color(0xFF92400E), fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE5E7EB)),

          // Bottom Action Bar
          Container(
            padding: const EdgeInsets.all(16.0),
            color: Colors.white,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.forest,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              onPressed: (_selectedFacility == null || _isSubmitting) ? null : _handleSubmitReferral,
              icon: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Icon(Icons.send_rounded),
              label: Text(
                _isSubmitting
                    ? appState.translate('submitting_referral')
                    : appState.translate('submit_referral_to', args: {'facility': _selectedFacility?.type ?? "Facility"}),
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
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
