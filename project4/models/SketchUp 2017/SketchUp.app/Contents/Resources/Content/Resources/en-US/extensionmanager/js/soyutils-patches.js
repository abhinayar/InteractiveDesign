// Copyright 2016 Trimble Navigation Ltd. All Rights Reserved.
// Author: thomthom@sketchup.com (Thomas Thomassen)


// Fixes an issue where the standalone version of Closure Templates will call
// goog.isString - which is missing.
// Filed issue: https://github.com/google/closure-templates/issues/106

/**
 * Returns true if the specified value is a string.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is a string.
 */
if (!goog.isString) {
  goog.isString = function(val) {
    return typeof val == 'string';
  };
}


// Fixes an issue where the standalone version of Closure Templates will call
// goog.assert functions - which are missing. To work around this we add some
// replacement noops. Asserts aren't used by the shipped Closure Template
// library so this should not affect it elsewhere.

if (!goog.asserts.assertNumber) {
  // These noops must return the input value as they are used in fluently.
  goog.asserts.assertNumber = function(value) { return value }
}
