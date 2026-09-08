/// Reusable validators for patient registration and clinical intake
class PatientValidators {
  /// Validates citizen full name:
  /// - Required
  /// - Length between 2 and 100 characters
  /// - Letters, spaces, dots, hyphens, and apostrophes only (no digits, no random punctuation)
  static String? validateName(String? name) {
    if (name == null || name.trim().isEmpty) {
      return 'Please enter the patient\'s full name';
    }
    final trimmed = name.trim();
    if (trimmed.length < 2) {
      return 'Full name must be at least 2 characters';
    }
    if (trimmed.length > 100) {
      return 'Full name cannot exceed 100 characters';
    }
    // Reject digits
    if (RegExp(r'[0-9]').hasMatch(trimmed)) {
      return 'Name should not contain numbers';
    }
    // Allow letters (including unicode characters for Indian languages/accents), spaces, dots, hyphens, apostrophes
    if (!RegExp(r"^[\p{L}\s\.\-']+$", unicode: true).hasMatch(trimmed)) {
      return 'Name should only contain letters, spaces, dots, or hyphens';
    }
    return null;
  }

  /// Validates Age:
  /// - If required, must be present
  /// - Integer between 0 and 125
  static String? validateAge(String? ageText, {bool isRequired = true}) {
    if (ageText == null || ageText.trim().isEmpty) {
      return isRequired ? 'Please enter age or select date of birth' : null;
    }
    final trimmed = ageText.trim();
    final age = int.tryParse(trimmed);
    if (age == null) {
      return 'Please enter a valid whole number for age';
    }
    if (age < 0 || age > 125) {
      return 'Age must be between 0 and 125 years';
    }
    return null;
  }

  /// Validates Date of Birth (DOB):
  /// - Format DD/MM/YYYY
  /// - Valid calendar date
  /// - Cannot be in the future
  /// - Year must be >= 1900
  static String? validateDob(String? dobText, {bool isRequired = false}) {
    if (dobText == null || dobText.trim().isEmpty) {
      return isRequired ? 'Please select date of birth' : null;
    }
    final trimmed = dobText.trim();
    final parts = trimmed.split('/');
    if (parts.length != 3) {
      return 'DOB must be in DD/MM/YYYY format';
    }

    final day = int.tryParse(parts[0]);
    final month = int.tryParse(parts[1]);
    final year = int.tryParse(parts[2]);

    if (day == null || month == null || year == null) {
      return 'DOB contains non-numeric date values';
    }

    if (year < 1900) {
      return 'Year cannot be earlier than 1900';
    }

    final now = DateTime.now();
    if (year > now.year) {
      return 'Date of birth cannot be in the future';
    }

    if (month < 1 || month > 12) {
      return 'Month must be between 1 and 12';
    }

    if (day < 1 || day > 31) {
      return 'Day must be between 1 and 31';
    }

    try {
      final dt = DateTime(year, month, day);
      // Validate that day wasn't overflowed (e.g. 31st of February becomes March 3rd)
      if (dt.day != day || dt.month != month || dt.year != year) {
        return 'Invalid calendar date for the given month';
      }
      if (dt.isAfter(now)) {
        return 'Date of birth cannot be in the future';
      }
    } catch (_) {
      return 'Invalid date of birth';
    }

    return null;
  }

  /// Calculates age from DD/MM/YYYY string, returns null if invalid.
  static int? calculateAgeFromDob(String? dob) {
    if (dob == null || dob.trim().isEmpty) return null;
    final trimmed = dob.trim();
    final parts = trimmed.split('/');
    if (parts.length == 3) {
      final d = int.tryParse(parts[0]);
      final m = int.tryParse(parts[1]);
      final y = int.tryParse(parts[2]);
      if (d != null && m != null && y != null) {
        try {
          final dt = DateTime(y, m, d);
          final now = DateTime.now();
          int age = now.year - dt.year;
          if (now.month < dt.month || (now.month == dt.month && now.day < dt.day)) {
            age--;
          }
          return (age >= 0 && age <= 125) ? age : null;
        } catch (_) {}
      }
    }
    return null;
  }

  /// Validates Indian Mobile Phone Number:
  /// - Required
  /// - Strips spaces, dashes, parens, and '+91' or '91' prefix
  /// - Must have exactly 10 digits
  /// - Must start with 6, 7, 8, or 9
  /// - Rejects all-identical digits (e.g. 0000000000, 1111111111)
  static String? validatePhone(String? phone) {
    if (phone == null || phone.trim().isEmpty) {
      return 'Please enter a 10-digit mobile phone number';
    }
    var clean = phone.trim().replaceAll(RegExp(r'[\s\-\(\)]'), '');
    if (clean.startsWith('+91')) {
      clean = clean.substring(3);
    } else if (clean.startsWith('91') && clean.length == 12) {
      clean = clean.substring(2);
    }

    final digits = clean.replaceAll(RegExp(r'[^\d]'), '');
    if (digits.length != clean.length) {
      return 'Phone number must only contain digits';
    }

    if (digits.length != 10) {
      return 'Phone number must be exactly 10 digits';
    }

    if (!RegExp(r'^[6-9]').hasMatch(digits)) {
      return 'Mobile number must start with 6, 7, 8, or 9';
    }

    // Check for repetitive bogus numbers (e.g. 0000000000, 1111111111)
    if (RegExp(r'^(\d)\1{9}$').hasMatch(digits)) {
      return 'Please enter a valid active mobile number';
    }

    return null;
  }

  /// Normalizes phone into standard format e.g. +919876543210
  static String normalizePhone(String phone) {
    var clean = phone.trim().replaceAll(RegExp(r'[\s\-\(\)]'), '');
    if (clean.startsWith('+91')) {
      clean = clean.substring(3);
    } else if (clean.startsWith('91') && clean.length == 12) {
      clean = clean.substring(2);
    }
    final digits = clean.replaceAll(RegExp(r'[^\d]'), '');
    return '+91$digits';
  }

  /// Validates Village / Ward:
  /// - Required
  /// - 2 to 100 characters
  static String? validateVillage(String? village) {
    if (village == null || village.trim().isEmpty) {
      return 'Please enter or select patient village / ward';
    }
    final trimmed = village.trim();
    if (trimmed.length < 2) {
      return 'Village name must be at least 2 characters';
    }
    if (trimmed.length > 100) {
      return 'Village name cannot exceed 100 characters';
    }
    return null;
  }

  /// Validates Primary Clinical Symptom:
  /// - Required
  /// - 3 to 250 characters
  static String? validatePrimarySymptom(String? symptom) {
    if (symptom == null || symptom.trim().isEmpty) {
      return 'Please describe the primary clinical symptom';
    }
    final trimmed = symptom.trim();
    if (trimmed.length < 3) {
      return 'Symptom description must be at least 3 characters';
    }
    if (trimmed.length > 250) {
      return 'Symptom description cannot exceed 250 characters';
    }
    return null;
  }

  /// Validates Duration (Days):
  /// - Integer between 1 and 365
  static String? validateDurationDays(dynamic days) {
    final val = days is int ? days : int.tryParse(days?.toString() ?? '');
    if (val == null || val < 1 || val > 365) {
      return 'Duration must be between 1 and 365 days';
    }
    return null;
  }

  /// Validates Clinical Notes:
  /// - Optional
  /// - Max 500 characters
  static String? validateNotes(String? notes) {
    if (notes != null && notes.trim().length > 500) {
      return 'Clinical notes cannot exceed 500 characters';
    }
    return null;
  }

  /// Checks if a symptom is currently present in a comma-separated symptom list
  static bool isSymptomInList(String? currentText, String symptom) {
    if (currentText == null || currentText.trim().isEmpty) return false;
    final trimmed = currentText.trim().toLowerCase();
    final target = symptom.trim().toLowerCase();
    final parts = trimmed.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
    if (parts.contains(target)) return true;
    return trimmed.contains(target);
  }

  /// Toggles a symptom in a comma-separated list:
  /// If present, removes it; if absent, appends it.
  static String toggleSymptomInList(String? currentText, String symptom) {
    final trimmedText = currentText?.trim() ?? '';
    final target = symptom.trim();
    if (trimmedText.isEmpty) {
      return target;
    }

    final parts = trimmedText
        .split(',')
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();

    final isSelected = parts.any((s) => s.toLowerCase() == target.toLowerCase()) ||
        trimmedText.toLowerCase().contains(target.toLowerCase());

    if (isSelected) {
      // Remove symptom
      parts.removeWhere((s) => s.toLowerCase() == target.toLowerCase());
      var newText = parts.join(', ');
      if (newText.toLowerCase().contains(target.toLowerCase())) {
        final pattern = RegExp(RegExp.escape(target), caseSensitive: false);
        newText = newText
            .replaceAll(pattern, '')
            .replaceAll(RegExp(r',\s*,+'), ',')
            .replaceAll(RegExp(r'^\s*,\s*|\s*,\s*$'), '')
            .trim();
      }
      return newText;
    } else {
      // Add symptom
      parts.add(target);
      return parts.join(', ');
    }
  }
}
