import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * RatingStepper
 * Visual stepper tracking dual review progress:
 * Step 1: Service Review -> Step 2: Professional Rating -> Done
 *
 * @param {Object} props
 * @param {number} props.currentStep - 1 (Service), 2 (Provider), or 3 (Complete)
 * @param {Array<string>} [props.steps] - Step labels
 */
export default function RatingStepper({
  currentStep = 1,
  steps = ['Service Quality', 'Field Professional', 'Complete'],
}) {
  return (
    <View style={styles.container}>
      <View style={styles.stepperRow}>
        {steps.map((label, idx) => {
          const stepNum = idx + 1;
          const isDone = currentStep > stepNum;
          const isActive = currentStep === stepNum;

          return (
            <React.Fragment key={label}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.circle,
                    isDone && styles.circleDone,
                    isActive && styles.circleActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.circleText,
                      isDone && styles.circleTextDone,
                      isActive && styles.circleTextActive,
                    ]}
                  >
                    {isDone ? '✓' : stepNum}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    (isActive || isDone) && styles.stepLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>

              {idx < steps.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    currentStep > stepNum && styles.connectorActive,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 6,
  },
  circleActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  circleDone: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  circleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
  },
  circleTextActive: {
    color: '#ffffff',
  },
  circleTextDone: {
    color: '#ffffff',
    fontSize: 13,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
    marginBottom: 20,
  },
  connectorActive: {
    backgroundColor: '#059669',
  },
});
