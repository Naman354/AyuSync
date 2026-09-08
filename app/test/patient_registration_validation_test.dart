import 'package:flutter_test/flutter_test.dart';
import 'package:ayusync_app/core/utils/patient_validators.dart';

void main() {
  group('Patient Registration Demographics Validation', () {
    test('Full Name validation adheres to letters, spaces, hyphens, dots, and apostrophes', () {
      // Valid names
      expect(PatientValidators.validateName('Ramesh Patel'), isNull);
      expect(PatientValidators.validateName('Sunita Rao-Chavan'), isNull);
      expect(PatientValidators.validateName("Pooja O'Connor"), isNull);
      expect(PatientValidators.validateName('Dr. Anand Verma'), isNull);
      expect(PatientValidators.validateName('A K'), isNull);

      // Invalid names
      expect(PatientValidators.validateName(null), isNotNull);
      expect(PatientValidators.validateName(''), isNotNull);
      expect(PatientValidators.validateName('   '), isNotNull);
      expect(PatientValidators.validateName('A'), contains('at least 2'));
      expect(PatientValidators.validateName('John123'), contains('numbers'));
      expect(PatientValidators.validateName('Pooja!@#'), contains('only contain letters'));
      expect(PatientValidators.validateName('A' * 101), contains('exceed 100'));
    });

    test('Age validation checks bounds between 0 and 125 and integer format', () {
      // Valid ages
      expect(PatientValidators.validateAge('0'), isNull);
      expect(PatientValidators.validateAge('25'), isNull);
      expect(PatientValidators.validateAge('125'), isNull);

      // Invalid ages
      expect(PatientValidators.validateAge(null, isRequired: true), isNotNull);
      expect(PatientValidators.validateAge('', isRequired: true), isNotNull);
      expect(PatientValidators.validateAge(null, isRequired: false), isNull);
      expect(PatientValidators.validateAge('-1'), contains('between 0 and 125'));
      expect(PatientValidators.validateAge('126'), contains('between 0 and 125'));
      expect(PatientValidators.validateAge('twenty'), contains('valid whole number'));
      expect(PatientValidators.validateAge('25.5'), contains('valid whole number'));
    });

    test('Date of Birth (DOB) validates DD/MM/YYYY calendar dates, past dates, and calculates age', () {
      // Valid dates
      expect(PatientValidators.validateDob('15/08/1947'), isNull);
      expect(PatientValidators.validateDob('29/02/2000'), isNull); // Leap year 2000
      expect(PatientValidators.validateDob('01/01/1990'), isNull);

      // Invalid dates
      expect(PatientValidators.validateDob('1990-01-01'), contains('DD/MM/YYYY'));
      expect(PatientValidators.validateDob('32/01/1990'), contains('Day must be between 1 and 31'));
      expect(PatientValidators.validateDob('15/13/1990'), contains('Month must be between 1 and 12'));
      expect(PatientValidators.validateDob('29/02/2021'), contains('Invalid calendar date')); // Not a leap year
      expect(PatientValidators.validateDob('01/01/2099'), contains('cannot be in the future'));
      expect(PatientValidators.validateDob('01/01/1850'), contains('earlier than 1900'));

      // Calculate age
      final calculated = PatientValidators.calculateAgeFromDob('01/01/2000');
      expect(calculated, isNotNull);
      expect(calculated!, greaterThanOrEqualTo(24));
    });

    test('Indian Mobile Phone Number validates 10 digits starting with 6, 7, 8, 9', () {
      // Valid numbers
      expect(PatientValidators.validatePhone('9876543210'), isNull);
      expect(PatientValidators.validatePhone('+91 98765 43210'), isNull);
      expect(PatientValidators.validatePhone('+91-8123456789'), isNull);
      expect(PatientValidators.validatePhone('917123456789'), isNull);
      expect(PatientValidators.validatePhone('6123456789'), isNull);

      // Invalid numbers
      expect(PatientValidators.validatePhone(null), contains('10-digit'));
      expect(PatientValidators.validatePhone(''), contains('10-digit'));
      expect(PatientValidators.validatePhone('98765'), contains('exactly 10 digits'));
      expect(PatientValidators.validatePhone('987654321012'), contains('exactly 10 digits'));
      expect(PatientValidators.validatePhone('5876543210'), contains('start with 6, 7, 8, or 9'));
      expect(PatientValidators.validatePhone('1234567890'), contains('start with 6, 7, 8, or 9'));
      expect(PatientValidators.validatePhone('0000000000'), contains('valid active mobile number'));
      expect(PatientValidators.validatePhone('9999999999'), contains('valid active mobile number'));

      // Normalization
      expect(PatientValidators.normalizePhone('9876543210'), equals('+919876543210'));
      expect(PatientValidators.normalizePhone('+91 98765 43210'), equals('+919876543210'));
      expect(PatientValidators.normalizePhone('919876543210'), equals('+919876543210'));
    });

    test('Village / Ward validates non-empty and minimum 2 characters', () {
      expect(PatientValidators.validateVillage('Khandala Ward 1'), isNull);
      expect(PatientValidators.validateVillage('Malwadi'), isNull);

      expect(PatientValidators.validateVillage(null), isNotNull);
      expect(PatientValidators.validateVillage(''), isNotNull);
      expect(PatientValidators.validateVillage(' '), isNotNull);
      expect(PatientValidators.validateVillage('K'), contains('at least 2'));
      expect(PatientValidators.validateVillage('A' * 101), contains('cannot exceed 100'));
    });
  });

  group('Clinical Intake & Assessment Validation', () {
    test('Primary Symptom requires at least 3 characters', () {
      expect(PatientValidators.validatePrimarySymptom('High fever with chills'), isNull);
      expect(PatientValidators.validatePrimarySymptom(null), isNotNull);
      expect(PatientValidators.validatePrimarySymptom(''), isNotNull);
      expect(PatientValidators.validatePrimarySymptom('ab'), contains('at least 3'));
      expect(PatientValidators.validatePrimarySymptom('a' * 251), contains('cannot exceed 250'));
    });

    test('Duration Days validates positive integer between 1 and 365', () {
      expect(PatientValidators.validateDurationDays(1), isNull);
      expect(PatientValidators.validateDurationDays(7), isNull);
      expect(PatientValidators.validateDurationDays(365), isNull);
      expect(PatientValidators.validateDurationDays('3'), isNull);

      expect(PatientValidators.validateDurationDays(0), isNotNull);
      expect(PatientValidators.validateDurationDays(-5), isNotNull);
      expect(PatientValidators.validateDurationDays(366), isNotNull);
      expect(PatientValidators.validateDurationDays('invalid'), isNotNull);
    });

    test('Clinical Notes validates optional field with maximum 500 characters', () {
      expect(PatientValidators.validateNotes(null), isNull);
      expect(PatientValidators.validateNotes(''), isNull);
      expect(PatientValidators.validateNotes('Patient has known history of hypertension.'), isNull);
      expect(PatientValidators.validateNotes('A' * 501), contains('cannot exceed 500'));
    });

    test('Quick Symptoms toggle: tap once adds, tap again removes, keeps state synchronized', () {
      // 1. Initial state empty
      String current = '';
      expect(PatientValidators.isSymptomInList(current, 'High Fever'), isFalse);

      // 2. Tap once -> add High Fever
      current = PatientValidators.toggleSymptomInList(current, 'High Fever');
      expect(current, equals('High Fever'));
      expect(PatientValidators.isSymptomInList(current, 'High Fever'), isTrue);

      // 3. Tap second symptom -> add Persistent Cough
      current = PatientValidators.toggleSymptomInList(current, 'Persistent Cough');
      expect(current, equals('High Fever, Persistent Cough'));
      expect(PatientValidators.isSymptomInList(current, 'High Fever'), isTrue);
      expect(PatientValidators.isSymptomInList(current, 'Persistent Cough'), isTrue);

      // 4. Tap again on High Fever -> removes High Fever, leaves Persistent Cough
      current = PatientValidators.toggleSymptomInList(current, 'High Fever');
      expect(current, equals('Persistent Cough'));
      expect(PatientValidators.isSymptomInList(current, 'High Fever'), isFalse);
      expect(PatientValidators.isSymptomInList(current, 'Persistent Cough'), isTrue);

      // 5. Tap again on Persistent Cough -> removes Persistent Cough, leaves empty
      current = PatientValidators.toggleSymptomInList(current, 'Persistent Cough');
      expect(current, isEmpty);
      expect(PatientValidators.isSymptomInList(current, 'Persistent Cough'), isFalse);
    });
  });
}
