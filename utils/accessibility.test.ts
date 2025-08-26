/**
 * @jest-environment node
 */
import { 
  accessibilityTestUtils, 
  createAccessibilityState, 
  generateAccessibilityHint,
  generateAccessibilityLabel 
} from './accessibility';

// Mock AccessibilityInfo
jest.mock('react-native', () => ({
  AccessibilityInfo: {
    isScreenReaderEnabled: jest.fn(),
    isReduceMotionEnabled: jest.fn(),
    addEventListener: jest.fn(),
    announceForAccessibility: jest.fn(),
    setAccessibilityFocus: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
  findNodeHandle: jest.fn(),
}));

describe('Accessibility Utilities', () => {
  describe('generateAccessibilityLabel', () => {
    it('should generate basic label', () => {
      const label = generateAccessibilityLabel('Button');
      expect(label).toBe('Button');
    });

    it('should generate label with action', () => {
      const label = generateAccessibilityLabel('Button', 'Press');
      expect(label).toBe('Press Button');
    });

    it('should generate label with action and context', () => {
      const label = generateAccessibilityLabel('Button', 'Press', 'to submit form');
      expect(label).toBe('Press Button to submit form');
    });
  });

  describe('generateAccessibilityHint', () => {
    it('should generate basic hint', () => {
      const hint = generateAccessibilityHint('submit form');
      expect(hint).toBe('Double tap to submit form');
    });

    it('should generate hint with result', () => {
      const hint = generateAccessibilityHint('submit form', 'Form will be sent');
      expect(hint).toBe('Double tap to submit form. Form will be sent');
    });
  });

  describe('createAccessibilityState', () => {
    it('should create basic accessibility state', () => {
      const state = createAccessibilityState();
      expect(state).toEqual({
        disabled: undefined,
        selected: undefined,
        busy: undefined,
        expanded: undefined,
        checked: undefined,
      });
    });

    it('should create accessibility state with disabled', () => {
      const state = createAccessibilityState(true);
      expect(state.disabled).toBe(true);
    });

    it('should create accessibility state with all properties', () => {
      const state = createAccessibilityState(true, true, true, true, true);
      expect(state).toEqual({
        disabled: true,
        selected: true,
        busy: true,
        expanded: true,
        checked: true,
      });
    });
  });

  describe('accessibilityTestUtils', () => {
    describe('hasAccessibilityProps', () => {
      it('should return true when accessibility props are present', () => {
        const props = {
          accessibilityLabel: 'Test button',
          accessibilityRole: 'button',
        };
        expect(accessibilityTestUtils.hasAccessibilityProps(props)).toBe(true);
      });

      it('should return false when no accessibility props are present', () => {
        const props = {
          style: { color: 'red' },
          onPress: () => {},
        };
        expect(accessibilityTestUtils.hasAccessibilityProps(props)).toBe(false);
      });
    });

    describe('isValidAccessibilityLabel', () => {
      it('should return true for valid label', () => {
        expect(accessibilityTestUtils.isValidAccessibilityLabel('Valid label')).toBe(true);
      });

      it('should return false for empty label', () => {
        expect(accessibilityTestUtils.isValidAccessibilityLabel('')).toBe(false);
      });

      it('should return false for very long label', () => {
        const longLabel = 'a'.repeat(256);
        expect(accessibilityTestUtils.isValidAccessibilityLabel(longLabel)).toBe(false);
      });
    });

    describe('hasMinimumTouchTarget', () => {
      it('should return true for adequate touch target', () => {
        const style = { minHeight: 44, minWidth: 44 };
        expect(accessibilityTestUtils.hasMinimumTouchTarget(style)).toBe(true);
      });

      it('should return true for larger touch target', () => {
        const style = { height: 50, width: 50 };
        expect(accessibilityTestUtils.hasMinimumTouchTarget(style)).toBe(true);
      });

      it('should return false for small touch target', () => {
        const style = { minHeight: 30, minWidth: 30 };
        expect(accessibilityTestUtils.hasMinimumTouchTarget(style)).toBe(false);
      });

      it('should return false for missing dimensions', () => {
        const style = { color: 'red' };
        expect(accessibilityTestUtils.hasMinimumTouchTarget(style)).toBe(false);
      });
    });
  });
}); 