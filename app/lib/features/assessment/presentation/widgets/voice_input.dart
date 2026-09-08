import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

class VernacularVoiceInput extends StatefulWidget {
  final Function(String) onTranscriptionResult;

  const VernacularVoiceInput({super.key, required this.onTranscriptionResult});

  @override
  State<VernacularVoiceInput> createState() => _VernacularVoiceInputState();
}

class _VernacularVoiceInputState extends State<VernacularVoiceInput> {
  bool _isListening = false;
  String _currentLanguage = 'hi-IN'; // Default Hindi

  void _toggleListening() {
    setState(() {
      _isListening = !_isListening;
    });

    if (_isListening) {
      // BHASHINI / Vernacular Voice Integration (Mocked Speech Recognition)
      Future.delayed(const Duration(seconds: 2), () {
        if (!mounted) return;
        setState(() {
          _isListening = false;
        });
        widget.onTranscriptionResult("बुखार और खांसी (Fever and cough)");
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.sageBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFC7DEC8)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          DropdownButton<String>(
            value: _currentLanguage,
            underline: const SizedBox(),
            isDense: true,
            style: const TextStyle(fontSize: 12, color: AppColors.textDark, fontWeight: FontWeight.bold),
            items: const [
              DropdownMenuItem(value: 'hi-IN', child: Text('हिन्दी')),
              DropdownMenuItem(value: 'bn-IN', child: Text('বাংলা')),
              DropdownMenuItem(value: 'te-IN', child: Text('తెలుగు')),
              DropdownMenuItem(value: 'en-IN', child: Text('English')),
            ],
            onChanged: (val) {
              if (val != null) setState(() => _currentLanguage = val);
            },
          ),
          const SizedBox(width: 6),
          Text(
            _isListening ? 'Listening...' : 'Voice Input',
            style: TextStyle(
              fontSize: 11,
              color: _isListening ? Colors.red : AppColors.forest,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 6),
          InkWell(
            onTap: _toggleListening,
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _isListening ? Colors.red : AppColors.forest,
              ),
              child: Icon(_isListening ? Icons.stop_rounded : Icons.mic_rounded, color: Colors.white, size: 14),
            ),
          ),
        ],
      ),
    );
  }
}

class VoiceInputWidget extends StatelessWidget {
  final Function(String) onTranscriptReady;

  const VoiceInputWidget({super.key, required this.onTranscriptReady});

  @override
  Widget build(BuildContext context) {
    return VernacularVoiceInput(
      onTranscriptionResult: onTranscriptReady,
    );
  }
}
