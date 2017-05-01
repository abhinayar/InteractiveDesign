(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright 2016 Trimble Navigation Ltd. All Rights Reserved.
// Author: thomthom@sketchup.com (Thomas Thomassen)
"use strict";
var ExtensionPolicies = require("./extension_policies");
var SettingsDialog = require("./settings_dialog");
var UI = require("./ui");
var App = (function () {
    function App() {
        this.user_ = { nickname: '', logged_in: false };
    }
    Object.defineProperty(App.prototype, "config", {
        get: function () {
            return this.config_;
        },
        set: function (config) {
            this.config_ = config;
            SettingsDialog.update(config);
            ExtensionPolicies.updateTrustState();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(App.prototype, "user", {
        get: function () {
            return this.user_;
        },
        set: function (user) {
            this.user_ = user;
            UI.updateUserInfo(user);
        },
        enumerable: true,
        configurable: true
    });
    return App;
}());
exports.app = new App;
},{"./extension_policies":9,"./settings_dialog":15,"./ui":20}],2:[function(require,module,exports){
// Copyright 2016 Trimble Navigation Ltd. All Rights Reserved.
// Author: thomthom@sketchup.com (Thomas Thomassen)
"use strict";
var app_1 = require("./app");
var ExtensionHandler = require("./extension_handler");
var PageManager = require("./page_manager");
var SettingsDialog = require("./settings_dialog");
var SignOutDialog = require("./signout_dialog");
var SketchUp = require("./sketchup");
var UI = require("./ui");
function initExtensionActions() {
    $('#cmd-install-extension').on('click', ExtensionHandler.installExtension);
    $('#cmd-apply').on('click', function () {
        ExtensionHandler.applyEnabledStates();
        setEnableModified(false);
    });
    $('#cmd-discard').on('click', function () {
        ExtensionHandler.resetEnabledStates();
        setEnableModified(false);
    });
    // Initial state is hidden.
    $('.footer .extension-enable .btn').hide();
}
function setEnableModified(modified) {
    var $buttons = $('.footer .extension-enable .btn');
    modified ? $buttons.fadeIn('fast') : $buttons.fadeOut('fast');
}
function initExternalUrls() {
    $(document).on('click', '.su-url', function () {
        var urls = app_1.app.config.urls;
        var $link = $(this);
        var url_key = $link.data('su-url');
        var url = urls[url_key];
        SketchUp.openUrl(url);
        return false;
    });
}
function initTableActions() {
    // Fold/Unfold extension details.
    $(document).on('click', '.extension-list .details-toggle', function () {
        var $extension = $(this).closest('.em-extension');
        $extension.toggleClass('expanded');
        $extension.find('.em-extension-body').slideToggle('fast');
    });
    // Initialize finderSelect plugin to allow use to select the items in the
    // extension lists.
    // https://evulse.github.io/finderSelect/
    var extensions = $('#extension-list').finderSelect({
        children: '.em-extension'
    });
    $('#cmd-enable-bulk').on('click', function () {
        ExtensionHandler.setEnabledStates(true);
    });
    $('#cmd-disable-bulk').on('click', function () {
        ExtensionHandler.setEnabledStates(false);
    });
    $(document).on('change', '.extension-enable input', function () {
        setEnableModified(true);
    });
    $('#cmd-update-bulk').on('click', ExtensionHandler.updateAllExtensions);
    $('#cmd-uninstall-bulk').on('click', ExtensionHandler.uninstallAllExtensions);
    $(document).on('click', '.cmd-uninstall-extension', function () {
        ExtensionHandler.uninstallExtension(this);
    });
    $(document).on('click', '.cmd-update-extension', function () {
        ExtensionHandler.updateExtension(this);
    });
    $(document).on('click', '.cmd-trust-extension', ExtensionHandler.trustExtension);
    $(document).on('click', '.cmd-update-license', ExtensionHandler.updateLicense);
    $('#cmd-select-all').on('click', function () {
        $('#extension-list').finderSelect('highlightAll');
    });
    $('#cmd-select-none').on('click', function () {
        $('#extension-list').finderSelect('unHighlightAll');
    });
}
function initNavbarActions() {
    var $navbar = $('nav .navbar-nav:first-child');
    $navbar.find('a').on('click', PageManager.activate);
    $(document).on('click', '.user-info', function () {
        if (app_1.app.user.logged_in) {
            SignOutDialog.showDialog();
        }
        else {
            SketchUp.signInOrOut(true);
        }
    });
}
// Wire up the buttons for the Collapsable widget.
function initCollapseToggles() {
    $(document).on('click', '.su-collapsable .su-collapse-btn', function () {
        var $this = $(this);
        var $parent = $this.closest('.su-collapsable');
        var $target = $parent.find(".su-collapse-target");
        $target.slideToggle('fast');
        $parent.toggleClass('su-expanded');
        return false;
    });
}
// Boot ////////////////////////////////////////////////////////////////////////
$(document).ready(function () {
    UI.init();
    initNavbarActions();
    initExtensionActions();
    initTableActions();
    initExternalUrls();
    initCollapseToggles();
    SettingsDialog.init();
    // TODO(thomthom): Disabled until we find a fix for the issue that prevents
    // drag and drop for Chromium dialogs in the SketchUp client.
    //Dropzone.init();
    SketchUp.windowReady();
});
},{"./app":1,"./extension_handler":7,"./page_manager":13,"./settings_dialog":15,"./signout_dialog":16,"./sketchup":17,"./ui":20}],3:[function(require,module,exports){
// Copyright 2016 Trimble Navigation Ltd. All Rights Reserved.
// Author: thomthom@sketchup.com (Thomas Thomassen)
"use strict";
var PARAM_DELIMITER = ';';
function call(callbackName) {
    var parameters = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        parameters[_i - 1] = arguments[_i];
    }
    var callbackParams = '';
    if (parameters.length !== 0) {
        callbackParams = '@' + parameters.join(PARAM_DELIMITER);
    }
    if (isSketchUpClient()) {
        window.location.href = "skp:" + callbackName + callbackParams;
    }
    else {
        // For debugging in the browser we emit the callback as an alert instead.
        if (callbackName != 'WindowReady') {
            alert("" + callbackName + callbackParams);
        }
    }
}
exports.call = call;
function isBrowserClient() {
    // SketchUp inject a string like this: " SketchUp/17.0 (PC) "
    return navigator.userAgent.indexOf('SketchUp') < 0;
}
function isSketchUpClient() {
    return !isBrowserClient();
}
},{}],4:[function(require,module,exports){

},{}],5:[function(require,module,exports){
// Copyright 2016 Trimble Inc. All Rights Reserved.
"use strict";
// NOTE: This file is autogenerated by a script in gulpfile.js.
//       Do not manually edit this file.
// Extracted from extensionnotification.h
(function (ExtensionNotificationType) {
    ExtensionNotificationType[ExtensionNotificationType["kExtensionInstalled"] = 0] = "kExtensionInstalled";
    ExtensionNotificationType[ExtensionNotificationType["kExtensionUninstalled"] = 1] = "kExtensionUninstalled";
    ExtensionNotificationType[ExtensionNotificationType["kExtensionUpdated"] = 2] = "kExtensionUpdated";
})(exports.ExtensionNotificationType || (exports.ExtensionNotificationType = {}));
var ExtensionNotificationType = exports.ExtensionNotificationType;
;
(function (ExtensionResult) {
    ExtensionResult[ExtensionResult["kResultSucceeded"] = 0] = "kResultSucceeded";
    ExtensionResult[ExtensionResult["kResultFailed"] = 1] = "kResultFailed";
    ExtensionResult[ExtensionResult["kResultFailedRemoveLicense"] = 2] = "kResultFailedRemoveLicense";
    ExtensionResult[ExtensionResult["kResultFailedRemoveFiles"] = 3] = "kResultFailedRemoveFiles";
    ExtensionResult[ExtensionResult["kResultFailedNoArchiveHandler"] = 4] = "kResultFailedNoArchiveHandler";
    ExtensionResult[ExtensionResult["kResultFailedWriteAccess"] = 5] = "kResultFailedWriteAccess";
    ExtensionResult[ExtensionResult["kResultFailedDownload"] = 6] = "kResultFailedDownload";
    ExtensionResult[ExtensionResult["kResultFailedUpdateLicense"] = 7] = "kResultFailedUpdateLicense";
    ExtensionResult[ExtensionResult["kResultFailedUpdateVersionId"] = 8] = "kResultFailedUpdateVersionId";
    ExtensionResult[ExtensionResult["kResultFailedArchiveRead"] = 9] = "kResultFailedArchiveRead";
})(exports.ExtensionResult || (exports.ExtensionResult = {}));
var ExtensionResult = exports.ExtensionResult;
;
// NOTE: This file is autogenerated by a script in gulpfile.js.
//       Do not manually edit this file.
// Extracted from usefulenumerators.h
(function (ComplianceMode) {
    ComplianceMode[ComplianceMode["kCertified"] = 0] = "kCertified";
    ComplianceMode[ComplianceMode["kPrompt"] = 1] = "kPrompt";
    ComplianceMode[ComplianceMode["kCompatibility"] = 2] = "kCompatibility";
})(exports.ComplianceMode || (exports.ComplianceMode = {}));
var ComplianceMode = exports.ComplianceMode;
;
// NOTE: This file is autogenerated by a script in gulpfile.js.
//       Do not manually edit this file.
// Extracted from extensionlicense.h
(function (ExtensionLicenseState) {
    ExtensionLicenseState[ExtensionLicenseState["kExtensionLicenseState_Licensed"] = 0] = "kExtensionLicenseState_Licensed";
    ExtensionLicenseState[ExtensionLicenseState["kExtensionLicenseState_Expired"] = 1] = "kExtensionLicenseState_Expired";
    ExtensionLicenseState[ExtensionLicenseState["kExtensionLicenseState_Trial"] = 2] = "kExtensionLicenseState_Trial";
    ExtensionLicenseState[ExtensionLicenseState["kExtensionLicenseState_TrialExpired"] = 3] = "kExtensionLicenseState_TrialExpired";
    ExtensionLicenseState[ExtensionLicenseState["kExtensionLicenseState_NotLicensed"] = 4] = "kExtensionLicenseState_NotLicensed"; // Extension is not licensed
})(exports.ExtensionLicenseState || (exports.ExtensionLicenseState = {}));
var ExtensionLicenseState = exports.ExtensionLicenseState;
;
// NOTE: This file is autogenerated by a script in gulpfile.js.
//       Do not manually edit this file.
// Extracted from managedextension.h
(function (SignedStatus) {
    SignedStatus[SignedStatus["kValidSignature"] = 0] = "kValidSignature";
    SignedStatus[SignedStatus["kUnSigned"] = 1] = "kUnSigned";
    SignedStatus[SignedStatus["kInvalidSignature"] = 2] = "kInvalidSignature";
    SignedStatus[SignedStatus["kLegacySignature"] = 3] = "kLegacySignature"; // The Extension was signed with a previous version
})(exports.SignedStatus || (exports.SignedStatus = {}));
var SignedStatus = exports.SignedStatus;
;
},{}],6:[function(require,module,exports){
"use strict";
var prompt_1 = require("./prompt");
function showError(fragment) {
    var $dialog = getDialog();
    var $errors = $dialog.find('.extension-error-bag');
    $errors.append(fragment);
}
exports.showError = showError;
function getDialog() {
    // There might be a leftover from a previous dialog in the DOM tree. So we
    // must check if it's visible to check if it is still active.
    var $dialog = $('.ui-prompt');
    // This is somewhat of a hack - at least not pretty. Normally one can use
    // $dialog.is(':visible') which reads better - but not right after the
    // dialog is created and shown - then it would still return false.
    // Same thing for $dialog.hasClass('in');.
    // So instead we check for the overlay backdrop element Bootstrap creates.
    var visible = $('.modal-backdrop').length > 0;
    // Create the dialog if it isn't already visible.
    if ($dialog.length === 0 || !visible) {
        var prompt_2 = new prompt_1.PromptDialog(ui.prompt.extensionErrors);
        prompt_2.onAccept = function () {
            // Don't need to do anythning - but the PromptDialog need a function.
        };
        prompt_2.show();
        $dialog = prompt_2.element();
    }
    return $dialog;
}
},{"./prompt":14}],7:[function(require,module,exports){
// Copyright 2016 Trimble Navigation Ltd. All Rights Reserved.
// Author: thomthom@sketchup.com (Thomas Thomassen)
"use strict";
var app_1 = require('./app');
var prompt_1 = require("./prompt");
var SketchUp = require("./sketchup");
function extensionHtml(local_id) {
    var $extensions = $('#extension-list .em-extension');
    return $extensions.filter(function () {
        var data = $(this).data('extension');
        return (data.local_id === local_id);
    });
}
exports.extensionHtml = extensionHtml;
// Get the extension data stored on the extension list item. This can be any
// child of the extension list item.
function extensionData(element) {
    var $extension = $(element).closest('.em-extension');
    return $extension.data('extension');
}
exports.extensionData = extensionData;
function installExtension() {
    SketchUp.installExtensionFromFile();
}
exports.installExtension = installExtension;
// TODO: Don't disable the button, but change it's appearance when the
// extension cannot be uninstalled. And let the user click it so we can
// provide feedback to why it cannot be uninstalled.
// (check extension.can_uninstall)
function uninstallExtension(element) {
    var extension = extensionData(element);
    var prompt = new prompt_1.PromptDialog(ui.prompt.uninstallExtension);
    prompt.onAccept = function () {
        SketchUp.uninstallExtensions([extension.local_id]);
    };
    var data = { extensionName: extension.name };
    prompt.show(data);
}
exports.uninstallExtension = uninstallExtension;
function uninstallAllExtensions() {
    // Collect the ids of the extensions that have updates.
    var ids = [];
    var $extensions = getSelectedOrAll();
    $extensions.each(function () {
        var extension = $(this).data('extension');
        ids.push(extension.local_id);
    });
    // Prompt the user before updating multiple extensions.
    if (ids.length > 0) {
        var prompt_2 = new prompt_1.PromptDialog(ui.prompt.uninstallExtensions);
        prompt_2.onAccept = function () {
            SketchUp.uninstallExtensions(ids);
        };
        var data = { numExtensions: ids.length };
        prompt_2.show(data);
    }
}
exports.uninstallAllExtensions = uninstallAllExtensions;
function updateExtension(element) {
    if (!promptIfNotLoggedIn())
        return;
    var extension = extensionData(element);
    SketchUp.updateExtensions([extension.local_id]);
}
exports.updateExtension = updateExtension;
function updateAllExtensions() {
    if (!promptIfNotLoggedIn())
        return;
    // Collect the ids of the extensions that have updates.
    var ids = [];
    var $extensions = getSelectedOrAll();
    $extensions.each(function () {
        var extension = $(this).data('extension');
        if (extension.update_available) {
            ids.push(extension.local_id);
        }
    });
    // Prompt the user before updating multiple extensions.
    if (ids.length > 0) {
        var prompt_3 = new prompt_1.PromptDialog(ui.prompt.updateExtensions);
        prompt_3.onAccept = function () {
            SketchUp.updateExtensions(ids);
        };
        var data = { numExtensions: ids.length };
        prompt_3.show(data);
    }
}
exports.updateAllExtensions = updateAllExtensions;
function setEnabledStates(enable) {
    var $extensions = getSelectedOrAll();
    var $checkboxes = $extensions.find('input[type=checkbox]');
    $checkboxes.prop('checked', enable).change();
}
exports.setEnabledStates = setEnabledStates;
function applyEnabledStates() {
    var $checkboxes = $('#extensions input[type=checkbox]');
    var extensions = [];
    $checkboxes.each(function (checkbox) {
        var $checkbox = $(this);
        // TODO(thomthom): Update the data properties as well?
        var extension = $checkbox.closest('.em-extension').data('extension');
        var data = {
            local_id: extension.local_id,
            enabled: $checkbox.prop('checked')
        };
        extensions.push(data);
    });
    var data = { extensions: extensions };
    SketchUp.setExtensionsEnabled(data);
}
exports.applyEnabledStates = applyEnabledStates;
function resetEnabledStates() {
    var $checkboxes = $('#extensions input[type=checkbox]');
    var enabledIds = [];
    var disabledIds = [];
    $checkboxes.each(function (checkbox) {
        var $checkbox = $(this);
        var extension = extensionData(this);
        $checkbox.prop('checked', extension.loaded).change();
    });
}
exports.resetEnabledStates = resetEnabledStates;
function trustExtension() {
    var extension = extensionData(this);
    /*
    let prompt = new PromptDialog(ui.prompt.trustExtension)
    prompt.onAccept = function() {
      SketchUp.trustExtension(extension.local_id);
    };
    let data = { extensionName: extension.name }
    prompt.show(data);
    */
    // TODO(thomthom): Due to how the CExtensionManager currently handle loading
    // of approved extensions we are forced to use its own messaging via
    // messagebox. Leaving this in place in hope that we will be able to change
    // that before release.
    SketchUp.trustExtension(extension.local_id);
}
exports.trustExtension = trustExtension;
function updateLicense() {
    var extension = extensionData(this);
    SketchUp.updateLicense(extension.local_id);
}
exports.updateLicense = updateLicense;
function promptIfNotLoggedIn() {
    if (!app_1.app.user.logged_in) {
        var prompt_4 = new prompt_1.PromptDialog(ui.prompt.signInToUpdate);
        prompt_4.onAccept = function () { };
        prompt_4.show();
        return false;
    }
    return true;
}
function getSelectedOrAll() {
    var $extensions = $('#extension-list').finderSelect('selected');
    if ($extensions.length == 0) {
        $extensions = $('.em-extension');
    }
    return $extensions;
}
},{"./app":1,"./prompt":14,"./sketchup":17}],8:[function(require,module,exports){
// Copyright 2016 Trimble Navigation Limited
// Author: thomthom@sketchup.com (Thomas Thomassen)
"use strict";
var File = require("./file");
var ExtensionHandler = require("./extension_handler");
var ErrorDialog = require("./error_dialog");
var enums_1 = require("./enums");
exports.Result = enums_1.ExtensionResult;
var enums_2 = require("./enums");
exports.Type = enums_2.ExtensionNotificationType;
function onInstall(notification) {
    // TODO(thomthom): Highlight new extensions? We don't really know the
    // extension_id of new extensions. So we can't map an archive path to the
    // new extension. We need to detect this when we rebuild the extension list.
    if (notification.result != 0 /* kResultSucceeded */) {
        displayNotificationError(notification);
    }
}
exports.onInstall = onInstall;
function onUninstall(notification) {
    if (notification.result != 0 /* kResultSucceeded */) {
        displayNotificationError(notification);
    }
}
exports.onUninstall = onUninstall;
function onUpdate(notification) {
    if (notification.result != 0 /* kResultSucceeded */) {
        displayNotificationError(notification);
    }
}
exports.onUpdate = onUpdate;
function errorType(notification) {
    var template;
    switch (notification.type) {
        case 0 /* kExtensionInstalled */:
            template = ui.extension.error.failedInstall;
            break;
        case 1 /* kExtensionUninstalled */:
            template = ui.extension.error.failedUninstall;
            break;
        case 2 /* kExtensionUpdated */:
            template = ui.extension.error.failedUpdate;
            break;
        default:
            // TODO(thomthom): Should not be reached. Log somehow.
            return '';
    }
    var $extension = ExtensionHandler.extensionHtml(notification.extension_id);
    var name;
    if ($extension.length === 0) {
        // If we are unable to find an extension in our list that match the id in
        // the notification we use the id itself. In the case of installing
        // extensions this will contain the filename.
        name = File.basename(notification.extension_id);
    }
    else {
        // When we find a extension in the list we use the extension name.
        var extension = $extension.data('extension');
        name = extension.name;
    }
    var data = { extensionName: name };
    return template(data);
}
function errorDetails(notification) {
    var template;
    switch (notification.result) {
        case 1 /* kResultFailed */:
            return ''; // No details for this type.
        case 2 /* kResultFailedRemoveLicense */:
            template = ui.extension.error.failedRemoveLicense;
            break;
        case 3 /* kResultFailedRemoveFiles */:
            template = ui.extension.error.failedRemoveFiles;
            break;
        case 4 /* kResultFailedNoArchiveHandler */:
            var filetype = File.extname(notification.extension_id);
            template = ui.extension.error.failedNoArchiveHandler;
            return template({ filetype: filetype });
        case 5 /* kResultFailedWriteAccess */:
            template = ui.extension.error.failedWriteAccess;
            break;
        case 6 /* kResultFailedDownload */:
            template = ui.extension.error.failedDownload;
            break;
        case 7 /* kResultFailedUpdateLicense */:
            template = ui.extension.error.failedUpdateLicense;
            break;
        case 8 /* kResultFailedUpdateVersionId */:
            template = ui.extension.error.failedUpdateVersionId;
            break;
        case 9 /* kResultFailedArchiveRead */:
            template = ui.extension.error.failedArchiveRead;
            break;
        default:
            // No details for this type. Should not be reached.
            // TODO(thomthom): Log somehow.
            return '';
    }
    return template();
}
var ExtensionErrorType;
(function (ExtensionErrorType) {
    ExtensionErrorType[ExtensionErrorType["Notification"] = 0] = "Notification";
    ExtensionErrorType[ExtensionErrorType["LicenseError"] = 1] = "LicenseError";
})(ExtensionErrorType || (ExtensionErrorType = {}));
function displayNotificationError(notification) {
    var extension_id = notification.extension_id;
    var error = {
        extension_id: extension_id,
        type: 0 /* Notification */,
        error_code: notification.type,
        error_detail: notification.result
    };
    // Get user friendly error messages.
    var type = errorType(notification);
    var details = errorDetails(notification);
    // Generate the HTML template.
    var params = { type: type, details: details };
    displayExtensionError(error, ui.extension.error.html, params);
}
function displayLicenseError(extension) {
    var extension_id = extension.local_id;
    var error = {
        extension_id: extension_id,
        type: 1 /* LicenseError */,
        error_code: extension.license.state,
        error_detail: 0 // Doesn't have detail states.
    };
    // Get user friendly error messages.
    var type = ui.extension.error.licenseErrorTitle({ extensionName: extension.name });
    var details = ui.extension.error.licenseErrorDescription({ state: extension.license.state });
    // Generate the HTML template.
    var params = { type: type, details: details };
    displayExtensionError(error, ui.extension.error.html, params);
}
exports.displayLicenseError = displayLicenseError;
function errorExist($extension, error) {
    var $errors = $extension.find('.extension-error-bag .extension-error-item');
    var $existing = $errors.filter(function () {
        var $error = $(this);
        var currentError = $error.data('extension-error');
        if (currentError.type === error.type &&
            currentError.error_code === error.error_code &&
            currentError.error_detail === error.error_detail) {
            return true;
        }
        return false;
    });
    return $existing.length > 0;
}
// License errors are added when the extension list is updated. We need to call
// this when it updates in order to avoid displaying stale license errors that
// are no longer relevant.
function removeLicenseErrors(extension) {
    var $extension = ExtensionHandler.extensionHtml(extension.local_id);
    var $errors = $extension.find('.extension-error-bag .extension-error-item');
    $errors.each(function () {
        var $error = $(this);
        var currentError = $error.data('extension-error');
        if (currentError.type == 1 /* LicenseError */) {
            $error.detach();
        }
    });
}
exports.removeLicenseErrors = removeLicenseErrors;
function displayExtensionError(error, template, data) {
    var fragment = soy.renderAsFragment(ui.extension.error.html, data);
    // Attach the notification data to the element so we can locate them later on
    // if we wan't to remove an item which isn't relevant any more.
    $(fragment).data('extension-error', error);
    // Add the error to the list.
    var $extension = ExtensionHandler.extensionHtml(error.extension_id);
    if ($extension.length === 0) {
        // Some errors cannot be displayed contextually with an extension - as in
        // the case of installing a new extensions. For this we must display a
        // dialog.
        ErrorDialog.showError(fragment);
    }
    else {
        // For actions such as update/uninstall we display the error in context of
        // the extension in the extension list.
        if (!errorExist($extension, error)) {
            var $errors = $extension.find('.extension-error-bag');
            $errors.append(fragment);
        }
    }
}
},{"./enums":5,"./error_dialog":6,"./extension_handler":7,"./file":12}],9:[function(require,module,exports){
// Copyright 2016 Trimble Navigation Limited
// Author: thomthom@sketchup.com (Thomas Thomassen)
"use strict";
var app_1 = require("./app");
var utilities_1 = require("./utilities");
function IsSigned(extension) {
    return extension.signed == 0 /* kValidSignature */;
}
function allowedToLoad(extension) {
    switch (app_1.app.config.security_policy) {
        case 2 /* kCompatibility */:
            return true;
        case 1 /* kPrompt */:
            return IsSigned(extension) || extension.approved;
        case 0 /* kCertified */:
            return IsSigned(extension);
    }
    return false; // This would be an error.
}
exports.allowedToLoad = allowedToLoad;
function blockedFromLoading(extension) {
    return !allowedToLoad(extension);
}
exports.blockedFromLoading = blockedFromLoading;
function updateTrustState() {
    var $extensions = $('.em-extension');
    $extensions.each(function () {
        var $extension = $(this);
        var extension = $extension.data('extension');
        $extension.removeClass('extension-not-trusted extension-blocked');
        switch (app_1.app.config.security_policy) {
            case 1 /* kPrompt */:
                if (!extension.approved) {
                    $extension.addClass('extension-not-trusted');
                }
                break;
            case 0 /* kCertified */:
                if (!IsSigned(extension)) {
                    $extension.addClass('extension-blocked');
                }
                break;
        }
    });
    utilities_1.updateToggleButtons();
}
exports.updateTrustState = updateTrustState;
},{"./app":1,"./utilities":21}],10:[function(require,module,exports){
arguments[4][4][0].apply(exports,arguments)
},{"dup":4}],11:[function(require,module,exports){
// Copyright 2016 Trimble Navigation Ltd. All Rights Reserved.
// Author: thomthom@sketchup.com (Thomas Thomassen)
"use strict";
var app_1 = require("./app");
var ExtensionHandler = require("./extension_handler");
var ExtensionNotification = require("./extension_notification");
var ExtensionPolicies = require("./extension_policies");
var utilities_1 = require("./utilities");
// We add properties to the window object in order to create global hooks which
// SketchUp can call from the C++ side.
//
// These functions are called from outside the WebDialog. (Like Ruby or C++).
// Be careful renaming or changing these.
window.ExtensionManager = {
    // An ExtensionListNotification forwarded by ExtensionManagerDialog.
    onExtensionListUpdate: function (data) {
        var $extensionsList = $('#extension-list');
        // TODO(thomthom): We probably want different sorting options eventually.
        // This should be replaced with a function that return the extensions in
        // the order the user has chosen.
        var sortedExtensions = data.extensions.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });
        // Removes extensions that have been removed due to uninstall.
        purgeExtensions($extensionsList, sortedExtensions);
        var numUpdates = 0;
        // Populate the extension list in the same order as we sorted it.
        for (var index = 0; index < sortedExtensions.length; ++index) {
            var extension = sortedExtensions[index];
            updateOrAdd($extensionsList, index, extension);
            if (haveLicenseErrors(extension)) {
                ExtensionNotification.displayLicenseError(extension);
            }
            else {
                ExtensionNotification.removeLicenseErrors(extension);
            }
            // Indicate to the user how many updates are available in total.
            if (extension.update_available)
                ++numUpdates;
        }
        ;
        // Make sure to update the UI availible depending on the security mode
        // and the signed/trusted stated of the extension.
        ExtensionPolicies.updateTrustState();
        // Make sure to hook up events on some controls that doesn't have live
        // selectors that update dynamically.
        utilities_1.updateToggleButtons();
        // If there are no updates we don't want to display any number in the badge.
        $('#tab-manage .badge').text(numUpdates || '');
    },
    // An ExtensionNotification forwarded by ExtensionManagerDialog.
    onExtensionNotification: function (data) {
        var notification = data.notification;
        switch (notification.type) {
            case 0 /* kExtensionInstalled */:
                ExtensionNotification.onInstall(notification);
                break;
            case 1 /* kExtensionUninstalled */:
                ExtensionNotification.onUninstall(notification);
                break;
            case 2 /* kExtensionUpdated */:
                ExtensionNotification.onUpdate(notification);
                break;
        }
    },
    // A configuration object sent by the Extension Manager dialog.
    onConfigUpdate: function (data) {
        app_1.app.config = data.config;
    },
    // A notification sent by the Extension Manager dialog when the user sign in
    // or out.
    onUserUpdate: function (data) {
        app_1.app.user = data.user;
    }
};
// TODO(thomthom): Might be worth moving these function to a separate module in
// order to keep this file as a small delegate.
// Removes extensions from the UI if they don't have a match in the provided
// extension array.
function purgeExtensions(parent, extensions) {
    var ids = extensions.map(function (extension) {
        return extension.local_id;
    });
    parent.find('.em-extension').each(function () {
        var $extension = $(this);
        var extension = $extension.data('extension');
        if (ids.indexOf(extension.local_id) < 0) {
            $extension.detach();
        }
    });
}
function removeAlertClass($element) {
    $element.removeClass(function (index, css) {
        return (css.match(/(^|\s)alert-\S+/g) || []).join(' ');
    });
}
function updateSignedClass($element, signed) {
    removeAlertClass($element);
    // The template class doesn't return a string, must cast to one in order for
    // .addClass to work.
    var klass = String(ui.extension.signedStatusClass({ signed: signed }));
    $element.addClass(klass);
}
// Ensures that an extension list item exist for the given extension.
// Updates existing items or adds a new one.
function updateOrAdd(parent, index, extension) {
    var $extension = ExtensionHandler.extensionHtml(extension.local_id);
    // Update existing elements or add new items.
    if ($extension.length > 0) {
        // $extension.css('background', '#efe'); // Enable for visual debugging.
        // TODO(thomthom): At the moment we only sort by extension name. When we
        // allow the user to change what to sort by we might have to do some checks
        // here as well to ensure updated elements are in correct order.
        // This is somewhat fiddly. Would have been better if we were using a system
        // that could bind values between objects and HTML - saving us from this
        // manual syncing.
        var extensionStatus = String(ui.extension.signedStatus({ signed: extension.signed }));
        $extension.find('.extension-name').text(extension.name);
        $extension.find('.extension-creator').text(extension.creator);
        $extension.find('.extension-version').text(extension.version);
        $extension.find('.extension-copyright').text(extension.copyright);
        $extension.find('.extension-description').text(extension.description);
        $extension.find('.extension-signed').html(extensionStatus);
        var $signature = $extension.find('.extension-signature-badge .alert');
        updateSignedClass($signature, extension.signed);
        $extension.find('.cmd-update-extension')
            .prop('disabled', !extension.update_available);
        $extension.find('.cmd-uninstall-extension')
            .prop('disabled', !extension.can_uninstall);
        $extension.find('.extension-enable input')
            .prop('checked', extension.loaded);
        if (extension.thumbnail_url.length > 0) {
            $extension.find('.extension-thumbnail')
                .attr('src', extension.thumbnail_url);
        }
    }
    else {
        // This will compile the HTML from the template and create an unattached
        // HTML element.
        var fragment = soy.renderAsFragment(ui.extension.html, extension);
        $extension = $(fragment);
        // Insert at the given position.
        var $extensions = parent.find('.em-extension');
        var $existingItem = $extensions.eq(index);
        if ($existingItem.length > 0) {
            $existingItem.before($extension);
        }
        else {
            parent.append($extension);
        }
        // Prevent certain areas of the extension list from triggering
        // select change. This must be done like this instead of a global listener
        // because otherwise it won't prevent bubbling.
        $extension.find('.no-select').on('mousedown', function () {
            return false;
        });
    }
    // Store the whole extension data object along with the table row so it
    // can be easily accessed when the user interacts with it.
    $extension.data('extension', extension);
}
function haveLicenseErrors(extension) {
    if (!extension || !extension.license)
        return false;
    switch (extension.license.state) {
        case 0 /* kExtensionLicenseState_Licensed */:
        case 2 /* kExtensionLicenseState_Trial */:
            return false;
        default:
            return true;
    }
}
},{"./app":1,"./extension_handler":7,"./extension_notification":8,"./extension_policies":9,"./utilities":21}],12:[function(require,module,exports){
// Copyright 2016 Trimble Navigation Limited
// Author: thomthom@sketchup.com (Thomas Thomassen)
"use strict";
// http://stackoverflow.com/questions/3820381/need-a-basename-function-in-javascript#comment29942319_15270931
function basename(path) {
    return path.split(/[\\/]/).pop();
}
exports.basename = basename;
function extname(path) {
    return path.split(/[.]/).pop();
}
exports.extname = extname;
},{}],13:[function(require,module,exports){
// Copyright 2016 Trimble Navigation Limited
// Author: thomthom@sketchup.com (Thomas Thomassen)
"use strict";
var utilities_1 = require("./utilities");
// Handles the tab toggle from the top nav bar. Switch to the appropriate
// page and set the workspace mode.
function activate() {
    // Toggles the active navigation element.
    var $link = $(this);
    $link.closest('.nav').children('li').removeClass('active');
    $link.closest('li').addClass('active');
    // Toggles the active page.
    var page = $link.data('page');
    $('.page').removeClass('active');
    $('#' + page).addClass('active');
    // Sets the current page mode.
    var mode = $link.data('page-mode');
    $("body").removeClass(function (index, css) {
        return (css.match(/(^|\s)mode-\S+/g) || []).join(' ');
    });
    $('body').addClass(mode);
    // Needed to account for odd glitch where the toggle buttons doesn't size
    // correctly unless they are visible when this is done.
    utilities_1.updateToggleButtons();
}
exports.activate = activate;
},{"./utilities":21}],14:[function(require,module,exports){
// Copyright 2016 Trimble Navigation Ltd. All Rights Reserved.
// Author: thomthom@sketchup.com (Thomas Thomassen)
"use strict";
/* A class to construct a prompt message to the user. Offers callbacks for
 * acceptance and rejection.
 *
 * let prompt = new PromptDialog(ui.prompt.hello)
 * prompt.onAccept = function() {
 *   alert('Hello World');
 * };
 * prompt.show();
 */
var PromptDialog = (function () {
    function PromptDialog(template) {
        this.template = template;
        // Reject will by default do nothing.
        this.onReject = function () { };
    }
    PromptDialog.prototype.show = function (data) {
        var _this = this;
        // Clean up any previous prompts.
        this.element().detach();
        // Create the HTML elements.
        var dialog = soy.renderAsFragment(this.template, data);
        var $dialog = $(dialog);
        // Hook up events.
        $dialog.find('.btn-accept').on('click', function () {
            _this.onAccept();
        });
        $dialog.find('.btn-reject').on('click', function () {
            _this.onReject();
        });
        // Display the prompt.
        $('body').append($dialog);
        $dialog.modal();
    };
    PromptDialog.prototype.element = function () {
        return $('.ui-prompt');
    };
    return PromptDialog;
}());
exports.PromptDialog = PromptDialog;
},{}],15:[function(require,module,exports){
// Copyright 2016 Trimble Navigation Limited
// Author: thomthom@sketchup.com (Thomas Thomassen)
"use strict";
var SketchUp = require("./sketchup");
function init() {
    var $confirmButton = $("#modal-settings .btn-confirm");
    $confirmButton.on("click", onConfirm);
    // Add a class to the parent list element that reflect the checkbox state.
    $(document).on('change', '#modal-settings .su-option-list input', function () {
        var $radiobox = $(this);
        var $li = $radiobox.closest('li');
        $('#modal-settings .su-option-list li').removeClass('selected');
        if ($radiobox.is(':checked')) {
            $li.addClass('selected');
        }
        return false;
    });
}
exports.init = init;
function update(config) {
    var mode = config.security_policy;
    var $option = $("input:radio[name='option-security-mode'][value=" + mode + "]");
    $option.prop("checked", true).change();
}
exports.update = update;
function onConfirm() {
    var $checkedOption = $("input:radio[name='option-security-mode']:checked");
    var settingsSecurity = $checkedOption.val();
    SketchUp.setSecurityPolicy(settingsSecurity);
}
},{"./sketchup":17}],16:[function(require,module,exports){
"use strict";
var prompt_1 = require("./prompt");
var SketchUp = require("./sketchup");
function showDialog() {
    var $dialog = getDialog();
}
exports.showDialog = showDialog;
function getDialog() {
    // There might be a leftover from a previous dialog in the DOM tree. So we
    // must check if it's visible to check if it is still active.
    var $dialog = $('.ui-prompt');
    // This is somewhat of a hack - at least not pretty. Normally one can use
    // $dialog.is(':visible') which reads better - but not right after the
    // dialog is created and shown - then it would still return false.
    // Same thing for $dialog.hasClass('in');.
    // So instead we check for the overlay backdrop element Bootstrap creates.
    var visible = $('.modal-backdrop').length > 0;
    // Create the dialog if it isn't already visible.
    if ($dialog.length === 0 || !visible) {
        var prompt_2 = new prompt_1.PromptDialog(ui.prompt.signOut);
        prompt_2.onAccept = function () {
            // Don't need to do anything - but the PromptDialog need a function.
            SketchUp.signInOrOut(false);
        };
        prompt_2.show();
        $dialog = prompt_2.element();
    }
    return $dialog;
}
},{"./prompt":14,"./sketchup":17}],17:[function(require,module,exports){
// Copyright 2016 Trimble Navigation Ltd. All Rights Reserved.
// Author: thomthom@sketchup.com (Thomas Thomassen)
"use strict";
var Bridge = require("./bridge");
function setExtensionsEnabled(extensions) {
    // We cannot send arrays, or simple objects, so we use JSON strings instead.
    var json = JSON.stringify(extensions);
    Bridge.call('SetExtensionsEnabled', json);
}
exports.setExtensionsEnabled = setExtensionsEnabled;
function installExtensionFromFile() {
    Bridge.call('InstallExtensionFromFile');
}
exports.installExtensionFromFile = installExtensionFromFile;
function uninstallExtensions(ids) {
    Bridge.call.apply(Bridge, ['UninstallExtensions'].concat(ids));
}
exports.uninstallExtensions = uninstallExtensions;
function updateExtensions(ids) {
    Bridge.call.apply(Bridge, ['UpdateExtensions'].concat(ids));
}
exports.updateExtensions = updateExtensions;
function trustExtension(id) {
    Bridge.call('TrustExtension', id);
}
exports.trustExtension = trustExtension;
function updateLicense(id) {
    Bridge.call('UpdateLicense', id);
}
exports.updateLicense = updateLicense;
function setSecurityPolicy(mode) {
    Bridge.call('SetSecurityPolicy', mode);
}
exports.setSecurityPolicy = setSecurityPolicy;
function windowReady() {
    Bridge.call('WindowReady');
}
exports.windowReady = windowReady;
function signInOrOut(sign_in) {
    Bridge.call('SignInOrOut', sign_in);
}
exports.signInOrOut = signInOrOut;
function openUrl(url) {
    Bridge.call('OpenUrl', url);
}
exports.openUrl = openUrl;
},{"./bridge":3}],18:[function(require,module,exports){
arguments[4][4][0].apply(exports,arguments)
},{"dup":4}],19:[function(require,module,exports){
arguments[4][4][0].apply(exports,arguments)
},{"dup":4}],20:[function(require,module,exports){
// Copyright 2016 Trimble Navigation Limited
// Author: thomthom@sketchup.com (Thomas Thomassen)
"use strict";
function init() {
    // To prevent hard coding the values for the security options and risk getting
    // them out of sync we pass these values to the template when its initialized.
    var config = {
        settings: {
            security: {
                mode_signed_only: 0 /* kCertified */,
                mode_approve: 1 /* kPrompt */,
                mode_off: 2 /* kCompatibility */
            }
        }
    };
    soy.renderElement(document.body, ui.dialog.html, config);
    // Bootstrap will set the tab focus to the element that triggered the element
    // after it closes. This yields an undesired blue focus rectangle. We still
    // want to allow the user to tab through the UI elements so we can't simply
    // remove the outline. So we tap into the event when the modal closes and
    // make sure to remove focus from the element.
    $(document).on('hidden.bs.modal', '#modal-settings', function () {
        $('.settings-icon a').blur();
    });
    disable_select();
    disable_context_menu();
}
exports.init = init;
function updateUserInfo(user) {
    var userInfo = $('.user-info').get(0);
    soy.renderElement(userInfo, ui.navbar.user, user);
}
exports.updateUserInfo = updateUserInfo;
/* Disables text selection on elements other than input type elements where
 * it makes sense to allow selections. This mimics native windows.
 */
function disable_select() {
    $(document).on('mousedown selectstart', function (e) {
        return $(e.target).is('input, textarea, select, option');
    });
}
/* Disables the context menu with the exception for textboxes in order to
 * mimic native windows.
 */
function disable_context_menu() {
    $(document).on('contextmenu', function (e) {
        // Allow Ctrl + Shift to enable the native context menu as a backdoor for
        // debugging.
        if (e.ctrlKey && e.shiftKey)
            return true;
        // Otherwise disable it for non-input elements.
        return $(e.target).is('input[type=text], input[type=email], input[type=password], textarea');
    });
}
},{}],21:[function(require,module,exports){
// Copyright 2016 Trimble Navigation Limited
// Author: thomthom@sketchup.com (Thomas Thomassen)
"use strict";
// https://remysharp.com/2010/07/21/throttling-function-calls
function debounce(fn, delay) {
    var timer = null;
    return function () {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            fn.apply(context, args);
        }, delay);
    };
}
exports.debounce = debounce;
function randomFromRange(min, max) {
    return Math.floor(Math.random() * max) + min;
}
exports.randomFromRange = randomFromRange;
function updateToggleButtons() {
    // http://stackoverflow.com/a/32588312/486990
    // now that we have dynamically loaded elements
    // we need to initialize any toggles that were added
    // you shouldn't re-initialize any toggles already present
    // but we also do want to have to figure out how to find the ones we added
    // instead, we'll destroy all toggles and recreate all new ones
    $("[data-toggle='toggle']").bootstrapToggle('destroy');
    $("[data-toggle='toggle']").bootstrapToggle();
}
exports.updateToggleButtons = updateToggleButtons;
},{}]},{},[19,4,10,11,18,2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzb3VyY2UvdHMvYXBwLnRzIiwic291cmNlL3RzL2Jvb3QudHMiLCJzb3VyY2UvdHMvYnJpZGdlLnRzIiwic291cmNlL3RzL2N1c3RvbS10eXBpbmdzL2luZGV4LmQudHMiLCJzb3VyY2UvdHMvZW51bXMudHMiLCJzb3VyY2UvdHMvZXJyb3JfZGlhbG9nLnRzIiwic291cmNlL3RzL2V4dGVuc2lvbl9oYW5kbGVyLnRzIiwic291cmNlL3RzL2V4dGVuc2lvbl9ub3RpZmljYXRpb24udHMiLCJzb3VyY2UvdHMvZXh0ZW5zaW9uX3BvbGljaWVzLnRzIiwic291cmNlL3RzL2V4dGVybmFsLnRzIiwic291cmNlL3RzL2ZpbGUudHMiLCJzb3VyY2UvdHMvcGFnZV9tYW5hZ2VyLnRzIiwic291cmNlL3RzL3Byb21wdC50cyIsInNvdXJjZS90cy9zZXR0aW5nc19kaWFsb2cudHMiLCJzb3VyY2UvdHMvc2lnbm91dF9kaWFsb2cudHMiLCJzb3VyY2UvdHMvc2tldGNodXAudHMiLCJzb3VyY2UvdHMvdWkudHMiLCJzb3VyY2UvdHMvdXRpbGl0aWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsOERBQThEO0FBQzlELG1EQUFtRDs7QUFHbkQsSUFBWSxpQkFBaUIsV0FBTSxzQkFBc0IsQ0FBQyxDQUFBO0FBQzFELElBQVksY0FBYyxXQUFNLG1CQUFtQixDQUFDLENBQUE7QUFDcEQsSUFBWSxFQUFFLFdBQU0sTUFBTSxDQUFDLENBQUE7QUFJM0I7SUFJRTtRQUNFLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQTtJQUNqRCxDQUFDO0lBR0Qsc0JBQUksdUJBQU07YUFBVjtZQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3RCLENBQUM7YUFFRCxVQUFXLE1BQWM7WUFDdkIsSUFBSSxD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O0FBQzlDLENBQUM7QUFGZSx1QkFBZSxrQkFFOUIsQ0FBQTtBQUdEO0lBQ0UsNkNBQTZDO0lBQzdDLCtDQUErQztJQUMvQyxvREFBb0Q7SUFDcEQsMERBQTBEO0lBQzFELDBFQUEwRTtJQUMxRSwrREFBK0Q7SUFDL0QsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFBO0lBQ3RELENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQ2hELENBQUM7QUFUZSwyQkFBbUIsc0JBU2xDLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQ29weXJpZ2h0IDIwMTYgVHJpbWJsZSBOYXZpZ2F0aW9uIEx0ZC4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vIEF1dGhvcjogdGhvbXRob21Ac2tldGNodXAuY29tIChUaG9tYXMgVGhvbWFzc2VuKVxuXG5pbXBvcnQgeyBDb25maWcgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCAqIGFzIEV4dGVuc2lvblBvbGljaWVzIGZyb20gXCIuL2V4dGVuc2lvbl9wb2xpY2llc1wiO1xuaW1wb3J0ICogYXMgU2V0dGluZ3NEaWFsb2cgZnJvbSBcIi4vc2V0dGluZ3NfZGlhbG9nXCI7XG5pbXBvcnQgKiBhcyBVSSBmcm9tIFwiLi91aVwiO1xuaW1wb3J0IHsgVXNlciB9IGZyb20gXCIuL3VzZXJcIjtcblxuXG5jbGFzcyBBcHAge1xuICBwcml2YXRlIGNvbmZpZ186IENvbmZpZztcbiAgcHJpdmF0ZSB1c2VyXzogVXNlcjtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnVzZXJfID0geyBuaWNrbmFtZTogJycsIGxvZ2dlZF9pbjogZmFsc2UgfVxuICB9XG5cblxuICBnZXQgY29uZmlnKCk6IENvbmZpZyB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnXztcbiAgfVxuXG4gIHNldCBjb25maWcoY29uZmlnOiBDb25maWcpIHtcbiAgICB0aGlzLmNvbmZpZ18gPSBjb25maWc7XG4gICAgU2V0dGluZ3NEaWFsb2cudXBkYXRlKGNvbmZpZyk7XG4gICAgRXh0ZW5zaW9uUG9saWNpZXMudXBkYXRlVHJ1c3RTdGF0ZSgpO1xuICB9XG5cblxuICBnZXQgdXNlcigpOiBVc2VyIHtcbiAgICByZXR1cm4gdGhpcy51c2VyXztcbiAgfVxuXG4gIHNldCB1c2VyKHVzZXI6IFVzZXIpIHtcbiAgICB0aGlzLnVzZXJfID0gdXNlcjtcbiAgICBVSS51cGRhdGVVc2VySW5mbyh1c2VyKTtcbiAgfVxufVxuXG5leHBvcnQgbGV0IGFwcCA9IG5ldyBBcHA7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUcmltYmxlIE5hdmlnYXRpb24gTHRkLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy8gQXV0aG9yOiB0aG9tdGhvbUBza2V0Y2h1cC5jb20gKFRob21hcyBUaG9tYXNzZW4pXG5cbmltcG9ydCB7IGFwcCB9IGZyb20gXCIuL2FwcFwiO1xuaW1wb3J0ICogYXMgQnJpZGdlIGZyb20gXCIuL2JyaWRnZVwiO1xuaW1wb3J0ICogYXMgRHJvcHpvbmUgZnJvbSBcIi4vZHJvcHpvbmVcIjtcbmltcG9ydCAqIGFzIEV4dGVuc2lvbkhhbmRsZXIgZnJvbSBcIi4vZXh0ZW5zaW9uX2hhbmRsZXJcIjtcbmltcG9ydCAqIGFzIFBhZ2VNYW5hZ2VyIGZyb20gXCIuL3BhZ2VfbWFuYWdlclwiO1xuaW1wb3J0ICogYXMgU2V0dGluZ3NEaWFsb2cgZnJvbSBcIi4vc2V0dGluZ3NfZGlhbG9nXCI7XG5pbXBvcnQgKiBhcyBTaWduT3V0RGlhbG9nIGZyb20gXCIuL3NpZ25vdXRfZGlhbG9nXCI7XG5pbXBvcnQgKiBhcyBTa2V0Y2hVcCBmcm9tIFwiLi9za2V0Y2h1cFwiO1xuaW1wb3J0ICogYXMgVUkgZnJvbSBcIi4vdWlcIjtcblxuXG5mdW5jdGlvbiBpbml0RXh0ZW5zaW9uQWN0aW9ucygpIHtcbiAgJCgnI2NtZC1pbnN0YWxsLWV4dGVuc2lvbicpLm9uKCdjbGljaycsIEV4dGVuc2lvbkhhbmRsZXIuaW5zdGFsbEV4dGVuc2lvbik7XG5cbiAgJCgnI2NtZC1hcHBseScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIEV4dGVuc2lvbkhhbmRsZXIuYXBwbHlFbmFibGVkU3RhdGVzKCk7XG4gICAgc2V0RW5hYmxlTW9kaWZpZWQoZmFsc2UpO1xuICB9KTtcblxuICAkKCcjY21kLWRpc2NhcmQnKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICBFeHRlbnNpb25IYW5kbGVyLnJlc2V0RW5hYmxlZFN0YXRlcygpO1xuICAgIHNldEVuYWJsZU1vZGlmaWVkKGZhbHNlKTtcbiAgfSk7XG5cbiAgLy8gSW5pdGlhbCBzdGF0ZSBpcyBoaWRkZW4uXG4gICQoJy5mb290ZXIgLmV4dGVuc2lvbi1lbmFibGUgLmJ0bicpLmhpZGUoKTtcbn1cblxuXG5mdW5jdGlvbiBzZXRFbmFibGVNb2RpZmllZChtb2RpZmllZDogYm9vbGVhbikge1xuICBsZXQgJGJ1dHRvbnMgPSAkKCcuZm9vdGVyIC5leHRlbnNpb24tZW5hYmxlIC5idG4nKTtcbiAgbW9kaWZpZWQgPyAkYnV0dG9ucy5mYWRlSW4oJ2Zhc3QnKSA6ICRidXR0b25zLmZhZGVPdXQoJ2Zhc3QnKTtcbn1cblxuXG5mdW5jdGlvbiBpbml0RXh0ZXJuYWxVcmxzKCkge1xuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnN1LXVybCcsIGZ1bmN0aW9uKCkge1xuICAgIGxldCB1cmxzOiBhbnkgPSBhcHAuY29uZmlnLnVybHM7XG4gICAgbGV0ICRsaW5rID0gJCh0aGlzKTtcbiAgICBsZXQgdXJsX2tleSA9ICRsaW5rLmRhdGEoJ3N1LXVybCcpO1xuICAgIGxldCB1cmwgPSB1cmxzW3VybF9rZXldO1xuICAgIFNrZXRjaFVwLm9wZW5VcmwodXJsKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pO1xufVxuXG5cbmZ1bmN0aW9uIGluaXRUYWJsZUFjdGlvbnMoKSB7XG4gIC8vIEZvbGQvVW5mb2xkIGV4dGVuc2lvbiBkZXRhaWxzLlxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmV4dGVuc2lvbi1saXN0IC5kZXRhaWxzLXRvZ2dsZScsIGZ1bmN0aW9uKCkge1xuICAgIGxldCAkZXh0ZW5zaW9uID0gJCh0aGlzKS5jbG9zZXN0KCcuZW0tZXh0ZW5zaW9uJyk7XG4gICAgJGV4dGVuc2lvbi50b2dnbGVDbGFzcygnZXhwYW5kZWQnKTtcbiAgICAkZXh0ZW5zaW9uLmZpbmQoJy5lbS1leHRlbnNpb24tYm9keScpLnNsaWRlVG9nZ2xlKCdmYXN0Jyk7XG4gIH0pO1xuXG4gIC8vIEluaXRpYWxpemUgZmluZGVyU2VsZWN0IHBsdWdpbiB0byBhbGxvdyB1c2UgdG8gc2VsZWN0IHRoZSBpdGVtcyBpbiB0aGVcbiAgLy8gZXh0ZW5zaW9uIGxpc3RzLlxuICAvLyBodHRwczovL2V2dWxzZS5naXRodWIuaW8vZmluZGVyU2VsZWN0L1xuICBsZXQgZXh0ZW5zaW9ucyA9ICQoJyNleHRlbnNpb24tbGlzdCcpLmZpbmRlclNlbGVjdCh7XG4gICAgY2hpbGRyZW46ICcuZW0tZXh0ZW5zaW9uJ1xuICB9KTtcblxuICAkKCcjY21kLWVuYWJsZS1idWxrJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgRXh0ZW5zaW9uSGFuZGxlci5zZXRFbmFibGVkU3RhdGVzKHRydWUpO1xuICB9KTtcblxuICAkKCcjY21kLWRpc2FibGUtYnVsaycpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIEV4dGVuc2lvbkhhbmRsZXIuc2V0RW5hYmxlZFN0YXRlcyhmYWxzZSk7XG4gIH0pO1xuXG4gICQoZG9jdW1lbnQpLm9uKCdjaGFuZ2UnLCAnLmV4dGVuc2lvbi1lbmFibGUgaW5wdXQnLCBmdW5jdGlvbigpIHtcbiAgICBzZXRFbmFibGVNb2RpZmllZCh0cnVlKTtcbiAgfSk7XG5cbiAgJCgnI2NtZC11cGRhdGUtYnVsaycpLm9uKCdjbGljaycsXG4gICAgICBFeHRlbnNpb25IYW5kbGVyLnVwZGF0ZUFsbEV4dGVuc2lvbnMpO1xuXG4gICQoJyNjbWQtdW5pbnN0YWxsLWJ1bGsnKS5vbignY2xpY2snLFxuICAgICAgRXh0ZW5zaW9uSGFuZGxlci51bmluc3RhbGxBbGxFeHRlbnNpb25zKTtcblxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmNtZC11bmluc3RhbGwtZXh0ZW5zaW9uJywgZnVuY3Rpb24oKSB7XG4gICAgRXh0ZW5zaW9uSGFuZGxlci51bmluc3RhbGxFeHRlbnNpb24odGhpcyk7XG4gIH0pO1xuXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuY21kLXVwZGF0ZS1leHRlbnNpb24nLCBmdW5jdGlvbigpIHtcbiAgICBFeHRlbnNpb25IYW5kbGVyLnVwZGF0ZUV4dGVuc2lvbih0aGlzKTtcbiAgfSk7XG5cbiAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5jbWQtdHJ1c3QtZXh0ZW5zaW9uJyxcbiAgICAgIEV4dGVuc2lvbkhhbmRsZXIudHJ1c3RFeHRlbnNpb24pO1xuXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuY21kLXVwZGF0ZS1saWNlbnNlJyxcbiAgICAgIEV4dGVuc2lvbkhhbmRsZXIudXBkYXRlTGljZW5zZSk7XG5cbiAgJCgnI2NtZC1zZWxlY3QtYWxsJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgJCgnI2V4dGVuc2lvbi1saXN0JykuZmluZGVyU2VsZWN0KCdoaWdobGlnaHRBbGwnKTtcbiAgfSk7XG5cbiAgJCgnI2NtZC1zZWxlY3Qtbm9uZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICQoJyNleHRlbnNpb24tbGlzdCcpLmZpbmRlclNlbGVjdCgndW5IaWdobGlnaHRBbGwnKTtcbiAgfSk7XG59XG5cblxuZnVuY3Rpb24gaW5pdE5hdmJhckFjdGlvbnMoKSB7XG4gIHZhciAkbmF2YmFyID0gJCgnbmF2IC5uYXZiYXItbmF2OmZpcnN0LWNoaWxkJyk7XG4gICRuYXZiYXIuZmluZCgnYScpLm9uKCdjbGljaycsIFBhZ2VNYW5hZ2VyLmFjdGl2YXRlKTtcblxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnVzZXItaW5mbycsIGZ1bmN0aW9uKCkge1xuICAgIGlmIChhcHAudXNlci5sb2dnZWRfaW4pIHtcbiAgICAgIFNpZ25PdXREaWFsb2cuc2hvd0RpYWxvZygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBTa2V0Y2hVcC5zaWduSW5Pck91dCh0cnVlKTtcbiAgICB9XG4gIH0pO1xufVxuXG5cbi8vIFdpcmUgdXAgdGhlIGJ1dHRvbnMgZm9yIHRoZSBDb2xsYXBzYWJsZSB3aWRnZXQuXG5mdW5jdGlvbiBpbml0Q29sbGFwc2VUb2dnbGVzKCkge1xuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnN1LWNvbGxhcHNhYmxlIC5zdS1jb2xsYXBzZS1idG4nLCBmdW5jdGlvbigpIHtcbiAgICBsZXQgJHRoaXMgPSAkKHRoaXMpO1xuICAgIGxldCAkcGFyZW50ID0gICR0aGlzLmNsb3Nlc3QoJy5zdS1jb2xsYXBzYWJsZScpO1xuICAgIGxldCAkdGFyZ2V0ID0gJHBhcmVudC5maW5kKFwiLnN1LWNvbGxhcHNlLXRhcmdldFwiKTtcbiAgICAkdGFyZ2V0LnNsaWRlVG9nZ2xlKCdmYXN0Jyk7XG4gICAgJHBhcmVudC50b2dnbGVDbGFzcygnc3UtZXhwYW5kZWQnKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pO1xufVxuXG5cbi8vIEJvb3QgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuICBVSS5pbml0KCk7XG4gIGluaXROYXZiYXJBY3Rpb25zKCk7XG4gIGluaXRFeHRlbnNpb25BY3Rpb25zKCk7XG4gIGluaXRUYWJsZUFjdGlvbnMoKTtcbiAgaW5pdEV4dGVybmFsVXJscygpO1xuICBpbml0Q29sbGFwc2VUb2dnbGVzKCk7XG4gIFNldHRpbmdzRGlhbG9nLmluaXQoKTtcbiAgLy8gVE9ETyh0aG9tdGhvbSk6IERpc2FibGVkIHVudGlsIHdlIGZpbmQgYSBmaXggZm9yIHRoZSBpc3N1ZSB0aGF0IHByZXZlbnRzXG4gIC8vIGRyYWcgYW5kIGRyb3AgZm9yIENocm9taXVtIGRpYWxvZ3MgaW4gdGhlIFNrZXRjaFVwIGNsaWVudC5cbiAgLy9Ecm9wem9uZS5pbml0KCk7XG5cbiAgU2tldGNoVXAud2luZG93UmVhZHkoKTtcbn0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVHJpbWJsZSBOYXZpZ2F0aW9uIEx0ZC4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cclxuLy8gQXV0aG9yOiB0aG9tdGhvbUBza2V0Y2h1cC5jb20gKFRob21hcyBUaG9tYXNzZW4pXHJcblxyXG5cclxuY29uc3QgUEFSQU1fREVMSU1JVEVSID0gJzsnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNhbGwoY2FsbGJhY2tOYW1lOiBzdHJpbmcsIC4uLnBhcmFtZXRlcnM6IGFueVtdKSB7XHJcbiAgbGV0IGNhbGxiYWNrUGFyYW1zID0gJyc7XHJcbiAgaWYgKHBhcmFtZXRlcnMubGVuZ3RoICE9PSAwKSB7XHJcbiAgICBjYWxsYmFja1BhcmFtcyA9ICdAJyArIHBhcmFtZXRlcnMuam9pbihQQVJBTV9ERUxJTUlURVIpO1xyXG4gIH1cclxuICBpZiAoaXNTa2V0Y2hVcENsaWVudCgpKSB7XHJcbiAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGBza3A6JHtjYWxsYmFja05hbWV9JHtjYWxsYmFja1BhcmFtc31gO1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvLyBGb3IgZGVidWdnaW5nIGluIHRoZSBicm93c2VyIHdlIGVtaXQgdGhlIGNhbGxiYWNrIGFzIGFuIGFsZXJ0IGluc3RlYWQuXHJcbiAgICBpZiAoY2FsbGJhY2tOYW1lICE9ICdXaW5kb3dSZWFkeScpIHtcclxuICAgICAgYWxlcnQoYCR7Y2FsbGJhY2tOYW1lfSR7Y2FsbGJhY2tQYXJhbXN9YClcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzQnJvd3NlckNsaWVudCgpIHtcclxuICAvLyBTa2V0Y2hVcCBpbmplY3QgYSBzdHJpbmcgbGlrZSB0aGlzOiBcIiBTa2V0Y2hVcC8xNy4wIChQQykgXCJcclxuICByZXR1cm4gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdTa2V0Y2hVcCcpIDwgMDtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNTa2V0Y2hVcENsaWVudCgpIHtcclxuICByZXR1cm4gIWlzQnJvd3NlckNsaWVudCgpO1xyXG59XHJcbiIsIiIsIi8vIENvcHlyaWdodCAyMDE2IFRyaW1ibGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuXG5cbi8vIE5PVEU6IFRoaXMgZmlsZSBpcyBhdXRvZ2VuZXJhdGVkIGJ5IGEgc2NyaXB0IGluIGd1bHBmaWxlLmpzLlxuLy8gICAgICAgRG8gbm90IG1hbnVhbGx5IGVkaXQgdGhpcyBmaWxlLlxuXG4vLyBFeHRyYWN0ZWQgZnJvbSBleHRlbnNpb25ub3RpZmljYXRpb24uaFxuXG5leHBvcnQgY29uc3QgZW51bSBFeHRlbnNpb25Ob3RpZmljYXRpb25UeXBlIHtcbiAga0V4dGVuc2lvbkluc3RhbGxlZCxcbiAga0V4dGVuc2lvblVuaW5zdGFsbGVkLFxuICBrRXh0ZW5zaW9uVXBkYXRlZCxcbn07XG5cbmV4cG9ydCBjb25zdCBlbnVtIEV4dGVuc2lvblJlc3VsdCB7XG4gIGtSZXN1bHRTdWNjZWVkZWQsXG4gIGtSZXN1bHRGYWlsZWQsXG4gIGtSZXN1bHRGYWlsZWRSZW1vdmVMaWNlbnNlLFxuICBrUmVzdWx0RmFpbGVkUmVtb3ZlRmlsZXMsXG4gIGtSZXN1bHRGYWlsZWROb0FyY2hpdmVIYW5kbGVyLFxuICBrUmVzdWx0RmFpbGVkV3JpdGVBY2Nlc3MsXG4gIGtSZXN1bHRGYWlsZWREb3dubG9hZCxcbiAga1Jlc3VsdEZhaWxlZFVwZGF0ZUxpY2Vuc2UsXG4gIGtSZXN1bHRGYWlsZWRVcGRhdGVWZXJzaW9uSWQsXG4gIGtSZXN1bHRGYWlsZWRBcmNoaXZlUmVhZCxcbn07XG5cblxuLy8gTk9URTogVGhpcyBmaWxlIGlzIGF1dG9nZW5lcmF0ZWQgYnkgYSBzY3JpcHQgaW4gZ3VscGZpbGUuanMuXG4vLyAgICAgICBEbyBub3QgbWFudWFsbHkgZWRpdCB0aGlzIGZpbGUuXG5cbi8vIEV4dHJhY3RlZCBmcm9tIHVzZWZ1bGVudW1lcmF0b3JzLmhcblxuZXhwb3J0IGNvbnN0IGVudW0gQ29tcGxpYW5jZU1vZGUge1xuICBrQ2VydGlmaWVkID0gMCxcbiAga1Byb21wdCxcbiAga0NvbXBhdGliaWxpdHlcbn07XG5cblxuLy8gTk9URTogVGhpcyBmaWxlIGlzIGF1dG9nZW5lcmF0ZWQgYnkgYSBzY3JpcHQgaW4gZ3VscGZpbGUuanMuXG4vLyAgICAgICBEbyBub3QgbWFudWFsbHkgZWRpdCB0aGlzIGZpbGUuXG5cbi8vIEV4dHJhY3RlZCBmcm9tIGV4dGVuc2lvbmxpY2Vuc2UuaFxuXG5leHBvcnQgY29uc3QgZW51bSBFeHRlbnNpb25MaWNlbnNlU3RhdGUge1xuICBrRXh0ZW5zaW9uTGljZW5zZVN0YXRlX0xpY2Vuc2VkLCAgICAgLy8gTGljZW5zZSBPa1xuICBrRXh0ZW5zaW9uTGljZW5zZVN0YXRlX0V4cGlyZWQsICAgICAgLy8gTGljZW5zZSB3YXMgdGVybWVkIGFuZCBleHBpcmVkXG4gIGtFeHRlbnNpb25MaWNlbnNlU3RhdGVfVHJpYWwsICAgICAgICAvLyBJbiB0cmlhbCBcbiAga0V4dGVuc2lvbkxpY2Vuc2VTdGF0ZV9UcmlhbEV4cGlyZWQsIC8vIFRyaWFsIHBlcmlvZCBoYXMgZW5kZWRcbiAga0V4dGVuc2lvbkxpY2Vuc2VTdGF0ZV9Ob3RMaWNlbnNlZCAgIC8vIEV4dGVuc2lvbiBpcyBub3QgbGljZW5zZWRcbn07XG5cblxuLy8gTk9URTogVGhpcyBmaWxlIGlzIGF1dG9nZW5lcmF0ZWQgYnkgYSBzY3JpcHQgaW4gZ3VscGZpbGUuanMuXG4vLyAgICAgICBEbyBub3QgbWFudWFsbHkgZWRpdCB0aGlzIGZpbGUuXG5cbi8vIEV4dHJhY3RlZCBmcm9tIG1hbmFnZWRleHRlbnNpb24uaFxuXG5leHBvcnQgY29uc3QgZW51bSBTaWduZWRTdGF0dXMge1xuICAgIGtWYWxpZFNpZ25hdHVyZSA9IDAsICAvLyBUaGUgZXh0ZW5zaW9uIGhhcyBhIHZhbGlkIHNpZ25hdHVyZVxuICAgIGtVblNpZ25lZCwgLy8gVGhlIGV4dGVuc2lvbiBpcyBtaXNzaW5nIHRoZSBzaWduYXR1cmUgZmlsZVxuICAgIGtJbnZhbGlkU2lnbmF0dXJlLCAvLyBUaGUgZXh0ZW5zaW9uIGhhcyBhbiBpbnZhbGlkIHNpZ25hdHVyZVxuICAgIGtMZWdhY3lTaWduYXR1cmUgLy8gVGhlIEV4dGVuc2lvbiB3YXMgc2lnbmVkIHdpdGggYSBwcmV2aW91cyB2ZXJzaW9uXG4gIH07XG4iLCJpbXBvcnQgeyBQcm9tcHREaWFsb2cgfSBmcm9tIFwiLi9wcm9tcHRcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzaG93RXJyb3IoZnJhZ21lbnQ6IEhUTUxFbGVtZW50KSB7XHJcbiAgbGV0ICRkaWFsb2cgPSBnZXREaWFsb2coKTtcclxuICBsZXQgJGVycm9ycyA9ICRkaWFsb2cuZmluZCgnLmV4dGVuc2lvbi1lcnJvci1iYWcnKTtcclxuICAkZXJyb3JzLmFwcGVuZChmcmFnbWVudCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldERpYWxvZygpIHtcclxuICAvLyBUaGVyZSBtaWdodCBiZSBhIGxlZnRvdmVyIGZyb20gYSBwcmV2aW91cyBkaWFsb2cgaW4gdGhlIERPTSB0cmVlLiBTbyB3ZVxyXG4gIC8vIG11c3QgY2hlY2sgaWYgaXQncyB2aXNpYmxlIHRvIGNoZWNrIGlmIGl0IGlzIHN0aWxsIGFjdGl2ZS5cclxuICBsZXQgJGRpYWxvZyA9ICQoJy51aS1wcm9tcHQnKTtcclxuICAvLyBUaGlzIGlzIHNvbWV3aGF0IG9mIGEgaGFjayAtIGF0IGxlYXN0IG5vdCBwcmV0dHkuIE5vcm1hbGx5IG9uZSBjYW4gdXNlXHJcbiAgLy8gJGRpYWxvZy5pcygnOnZpc2libGUnKSB3aGljaCByZWFkcyBiZXR0ZXIgLSBidXQgbm90IHJpZ2h0IGFmdGVyIHRoZVxyXG4gIC8vIGRpYWxvZyBpcyBjcmVhdGVkIGFuZCBzaG93biAtIHRoZW4gaXQgd291bGQgc3RpbGwgcmV0dXJuIGZhbHNlLlxyXG4gIC8vIFNhbWUgdGhpbmcgZm9yICRkaWFsb2cuaGFzQ2xhc3MoJ2luJyk7LlxyXG4gIC8vIFNvIGluc3RlYWQgd2UgY2hlY2sgZm9yIHRoZSBvdmVybGF5IGJhY2tkcm9wIGVsZW1lbnQgQm9vdHN0cmFwIGNyZWF0ZXMuXHJcbiAgbGV0IHZpc2libGUgPSAkKCcubW9kYWwtYmFja2Ryb3AnKS5sZW5ndGggPiAwO1xyXG4gIC8vIENyZWF0ZSB0aGUgZGlhbG9nIGlmIGl0IGlzbid0IGFscmVhZHkgdmlzaWJsZS5cclxuICBpZiAoJGRpYWxvZy5sZW5ndGggPT09IDAgfHwgIXZpc2libGUpIHtcclxuICAgIGxldCBwcm9tcHQgPSBuZXcgUHJvbXB0RGlhbG9nKHVpLnByb21wdC5leHRlbnNpb25FcnJvcnMpXHJcbiAgICBwcm9tcHQub25BY2NlcHQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgLy8gRG9uJ3QgbmVlZCB0byBkbyBhbnl0aG5pbmcgLSBidXQgdGhlIFByb21wdERpYWxvZyBuZWVkIGEgZnVuY3Rpb24uXHJcbiAgICB9O1xyXG4gICAgcHJvbXB0LnNob3coKTtcclxuICAgICRkaWFsb2cgPSBwcm9tcHQuZWxlbWVudCgpO1xyXG4gIH1cclxuICByZXR1cm4gJGRpYWxvZztcclxufVxyXG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUcmltYmxlIE5hdmlnYXRpb24gTHRkLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy8gQXV0aG9yOiB0aG9tdGhvbUBza2V0Y2h1cC5jb20gKFRob21hcyBUaG9tYXNzZW4pXG5cbmltcG9ydCB7IGFwcCB9IGZyb20gJy4vYXBwJztcbmltcG9ydCB7IEV4dGVuc2lvbiB9IGZyb20gJy4vZXh0ZW5zaW9uJ1xuaW1wb3J0IHsgUHJvbXB0RGlhbG9nIH0gZnJvbSBcIi4vcHJvbXB0XCI7XG5pbXBvcnQgeyB1cGRhdGVUb2dnbGVCdXR0b25zIH0gZnJvbSBcIi4vdXRpbGl0aWVzXCI7XG5pbXBvcnQgKiBhcyBTa2V0Y2hVcCBmcm9tIFwiLi9za2V0Y2h1cFwiO1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBleHRlbnNpb25IdG1sKGxvY2FsX2lkOiBzdHJpbmcpIHtcbiAgbGV0ICRleHRlbnNpb25zID0gJCgnI2V4dGVuc2lvbi1saXN0IC5lbS1leHRlbnNpb24nKTtcbiAgcmV0dXJuICRleHRlbnNpb25zLmZpbHRlcihmdW5jdGlvbigpIHtcbiAgICBsZXQgZGF0YSA9ICQodGhpcykuZGF0YSgnZXh0ZW5zaW9uJyk7XG4gICAgcmV0dXJuIChkYXRhLmxvY2FsX2lkID09PSBsb2NhbF9pZCk7XG4gIH0pO1xufVxuXG4vLyBHZXQgdGhlIGV4dGVuc2lvbiBkYXRhIHN0b3JlZCBvbiB0aGUgZXh0ZW5zaW9uIGxpc3QgaXRlbS4gVGhpcyBjYW4gYmUgYW55XG4vLyBjaGlsZCBvZiB0aGUgZXh0ZW5zaW9uIGxpc3QgaXRlbS5cbmV4cG9ydCBmdW5jdGlvbiBleHRlbnNpb25EYXRhKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogRXh0ZW5zaW9uIHtcbiAgbGV0ICRleHRlbnNpb24gPSAkKGVsZW1lbnQpLmNsb3Nlc3QoJy5lbS1leHRlbnNpb24nKTtcbiAgcmV0dXJuICRleHRlbnNpb24uZGF0YSgnZXh0ZW5zaW9uJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnN0YWxsRXh0ZW5zaW9uKCkge1xuICBTa2V0Y2hVcC5pbnN0YWxsRXh0ZW5zaW9uRnJvbUZpbGUoKTtcbn1cblxuLy8gVE9ETzogRG9uJ3QgZGlzYWJsZSB0aGUgYnV0dG9uLCBidXQgY2hhbmdlIGl0J3MgYXBwZWFyYW5jZSB3aGVuIHRoZVxuLy8gZXh0ZW5zaW9uIGNhbm5vdCBiZSB1bmluc3RhbGxlZC4gQW5kIGxldCB0aGUgdXNlciBjbGljayBpdCBzbyB3ZSBjYW5cbi8vIHByb3ZpZGUgZmVlZGJhY2sgdG8gd2h5IGl0IGNhbm5vdCBiZSB1bmluc3RhbGxlZC5cbi8vIChjaGVjayBleHRlbnNpb24uY2FuX3VuaW5zdGFsbClcbmV4cG9ydCBmdW5jdGlvbiB1bmluc3RhbGxFeHRlbnNpb24oZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgbGV0IGV4dGVuc2lvbiA9IGV4dGVuc2lvbkRhdGEoZWxlbWVudCk7XG4gIGxldCBwcm9tcHQgPSBuZXcgUHJvbXB0RGlhbG9nKHVpLnByb21wdC51bmluc3RhbGxFeHRlbnNpb24pXG4gIHByb21wdC5vbkFjY2VwdCA9IGZ1bmN0aW9uKCkge1xuICAgIFNrZXRjaFVwLnVuaW5zdGFsbEV4dGVuc2lvbnMoW2V4dGVuc2lvbi5sb2NhbF9pZF0pO1xuICB9O1xuICBsZXQgZGF0YSA9IHsgZXh0ZW5zaW9uTmFtZTogZXh0ZW5zaW9uLm5hbWUgfVxuICBwcm9tcHQuc2hvdyhkYXRhKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVuaW5zdGFsbEFsbEV4dGVuc2lvbnMoKSB7XG4gIC8vIENvbGxlY3QgdGhlIGlkcyBvZiB0aGUgZXh0ZW5zaW9ucyB0aGF0IGhhdmUgdXBkYXRlcy5cbiAgbGV0IGlkczogc3RyaW5nW10gPSBbXTtcbiAgbGV0ICRleHRlbnNpb25zID0gZ2V0U2VsZWN0ZWRPckFsbCgpO1xuICAkZXh0ZW5zaW9ucy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgIGxldCBleHRlbnNpb24gPSAkKHRoaXMpLmRhdGEoJ2V4dGVuc2lvbicpO1xuICAgIGlkcy5wdXNoKGV4dGVuc2lvbi5sb2NhbF9pZCk7XG4gIH0pO1xuICAvLyBQcm9tcHQgdGhlIHVzZXIgYmVmb3JlIHVwZGF0aW5nIG11bHRpcGxlIGV4dGVuc2lvbnMuXG4gIGlmIChpZHMubGVuZ3RoID4gMCkge1xuICAgIGxldCBwcm9tcHQgPSBuZXcgUHJvbXB0RGlhbG9nKHVpLnByb21wdC51bmluc3RhbGxFeHRlbnNpb25zKVxuICAgIHByb21wdC5vbkFjY2VwdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgU2tldGNoVXAudW5pbnN0YWxsRXh0ZW5zaW9ucyhpZHMpO1xuICAgIH07XG4gICAgbGV0IGRhdGEgPSB7IG51bUV4dGVuc2lvbnM6IGlkcy5sZW5ndGggfVxuICAgIHByb21wdC5zaG93KGRhdGEpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVFeHRlbnNpb24oZWxlbWVudDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgaWYgKCFwcm9tcHRJZk5vdExvZ2dlZEluKCkpXG4gICAgcmV0dXJuO1xuICBsZXQgZXh0ZW5zaW9uID0gZXh0ZW5zaW9uRGF0YShlbGVtZW50KTtcbiAgU2tldGNoVXAudXBkYXRlRXh0ZW5zaW9ucyhbZXh0ZW5zaW9uLmxvY2FsX2lkXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVBbGxFeHRlbnNpb25zKCk6IHZvaWQge1xuICBpZiAoIXByb21wdElmTm90TG9nZ2VkSW4oKSlcbiAgICByZXR1cm47XG4gIC8vIENvbGxlY3QgdGhlIGlkcyBvZiB0aGUgZXh0ZW5zaW9ucyB0aGF0IGhhdmUgdXBkYXRlcy5cbiAgbGV0IGlkczogc3RyaW5nW10gPSBbXTtcbiAgbGV0ICRleHRlbnNpb25zID0gZ2V0U2VsZWN0ZWRPckFsbCgpO1xuICAkZXh0ZW5zaW9ucy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgIGxldCBleHRlbnNpb24gPSAkKHRoaXMpLmRhdGEoJ2V4dGVuc2lvbicpO1xuICAgIGlmIChleHRlbnNpb24udXBkYXRlX2F2YWlsYWJsZSkge1xuICAgICAgaWRzLnB1c2goZXh0ZW5zaW9uLmxvY2FsX2lkKTtcbiAgICB9XG4gIH0pO1xuICAvLyBQcm9tcHQgdGhlIHVzZXIgYmVmb3JlIHVwZGF0aW5nIG11bHRpcGxlIGV4dGVuc2lvbnMuXG4gIGlmIChpZHMubGVuZ3RoID4gMCkge1xuICAgIGxldCBwcm9tcHQgPSBuZXcgUHJvbXB0RGlhbG9nKHVpLnByb21wdC51cGRhdGVFeHRlbnNpb25zKVxuICAgIHByb21wdC5vbkFjY2VwdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgU2tldGNoVXAudXBkYXRlRXh0ZW5zaW9ucyhpZHMpO1xuICAgIH07XG4gICAgbGV0IGRhdGEgPSB7IG51bUV4dGVuc2lvbnM6IGlkcy5sZW5ndGggfVxuICAgIHByb21wdC5zaG93KGRhdGEpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRFbmFibGVkU3RhdGVzKGVuYWJsZTogYm9vbGVhbikge1xuICBsZXQgJGV4dGVuc2lvbnMgPSBnZXRTZWxlY3RlZE9yQWxsKCk7XG4gIGxldCAkY2hlY2tib3hlcyA9ICRleHRlbnNpb25zLmZpbmQoJ2lucHV0W3R5cGU9Y2hlY2tib3hdJyk7XG4gICRjaGVja2JveGVzLnByb3AoJ2NoZWNrZWQnLCBlbmFibGUpLmNoYW5nZSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlFbmFibGVkU3RhdGVzKCkge1xuICBsZXQgJGNoZWNrYm94ZXMgPSAkKCcjZXh0ZW5zaW9ucyBpbnB1dFt0eXBlPWNoZWNrYm94XScpO1xuICBsZXQgZXh0ZW5zaW9uczogU2tldGNoVXAuRXh0ZW5zaW9uSnNvbltdID0gW107XG4gICRjaGVja2JveGVzLmVhY2goZnVuY3Rpb24oY2hlY2tib3gpIHtcbiAgICBsZXQgJGNoZWNrYm94ID0gJCh0aGlzKTtcbiAgICAvLyBUT0RPKHRob210aG9tKTogVXBkYXRlIHRoZSBkYXRhIHByb3BlcnRpZXMgYXMgd2VsbD9cbiAgICBsZXQgZXh0ZW5zaW9uID0gJGNoZWNrYm94LmNsb3Nlc3QoJy5lbS1leHRlbnNpb24nKS5kYXRhKCdleHRlbnNpb24nKTtcbiAgICBsZXQgZGF0YTogU2tldGNoVXAuRXh0ZW5zaW9uSnNvbiA9IHtcbiAgICAgIGxvY2FsX2lkOiBleHRlbnNpb24ubG9jYWxfaWQsXG4gICAgICBlbmFibGVkOiAkY2hlY2tib3gucHJvcCgnY2hlY2tlZCcpXG4gICAgfTtcbiAgICBleHRlbnNpb25zLnB1c2goZGF0YSk7XG4gIH0pO1xuICBsZXQgZGF0YTogU2tldGNoVXAuRXh0ZW5zaW9uSnNvbkRhdGEgPSB7IGV4dGVuc2lvbnM6IGV4dGVuc2lvbnMgfTtcbiAgU2tldGNoVXAuc2V0RXh0ZW5zaW9uc0VuYWJsZWQoZGF0YSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNldEVuYWJsZWRTdGF0ZXMoKSB7XG4gIGxldCAkY2hlY2tib3hlcyA9ICQoJyNleHRlbnNpb25zIGlucHV0W3R5cGU9Y2hlY2tib3hdJyk7XG4gIGxldCBlbmFibGVkSWRzOiBzdHJpbmdbXSA9IFtdO1xuICBsZXQgZGlzYWJsZWRJZHM6IHN0cmluZ1tdID0gW107XG4gICRjaGVja2JveGVzLmVhY2goZnVuY3Rpb24oY2hlY2tib3gpIHtcbiAgICBsZXQgJGNoZWNrYm94ID0gJCh0aGlzKTtcbiAgICBsZXQgZXh0ZW5zaW9uOiBFeHRlbnNpb24gPSBleHRlbnNpb25EYXRhKHRoaXMpO1xuICAgICRjaGVja2JveC5wcm9wKCdjaGVja2VkJywgZXh0ZW5zaW9uLmxvYWRlZCkuY2hhbmdlKCk7XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdHJ1c3RFeHRlbnNpb24oKSB7XG4gIGxldCBleHRlbnNpb24gPSBleHRlbnNpb25EYXRhKHRoaXMpO1xuICAvKlxuICBsZXQgcHJvbXB0ID0gbmV3IFByb21wdERpYWxvZyh1aS5wcm9tcHQudHJ1c3RFeHRlbnNpb24pXG4gIHByb21wdC5vbkFjY2VwdCA9IGZ1bmN0aW9uKCkge1xuICAgIFNrZXRjaFVwLnRydXN0RXh0ZW5zaW9uKGV4dGVuc2lvbi5sb2NhbF9pZCk7XG4gIH07XG4gIGxldCBkYXRhID0geyBleHRlbnNpb25OYW1lOiBleHRlbnNpb24ubmFtZSB9XG4gIHByb21wdC5zaG93KGRhdGEpO1xuICAqL1xuICAvLyBUT0RPKHRob210aG9tKTogRHVlIHRvIGhvdyB0aGUgQ0V4dGVuc2lvbk1hbmFnZXIgY3VycmVudGx5IGhhbmRsZSBsb2FkaW5nXG4gIC8vIG9mIGFwcHJvdmVkIGV4dGVuc2lvbnMgd2UgYXJlIGZvcmNlZCB0byB1c2UgaXRzIG93biBtZXNzYWdpbmcgdmlhXG4gIC8vIG1lc3NhZ2Vib3guIExlYXZpbmcgdGhpcyBpbiBwbGFjZSBpbiBob3BlIHRoYXQgd2Ugd2lsbCBiZSBhYmxlIHRvIGNoYW5nZVxuICAvLyB0aGF0IGJlZm9yZSByZWxlYXNlLlxuICBTa2V0Y2hVcC50cnVzdEV4dGVuc2lvbihleHRlbnNpb24ubG9jYWxfaWQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlTGljZW5zZSgpIHtcbiAgbGV0IGV4dGVuc2lvbiA9IGV4dGVuc2lvbkRhdGEodGhpcyk7XG4gIFNrZXRjaFVwLnVwZGF0ZUxpY2Vuc2UoZXh0ZW5zaW9uLmxvY2FsX2lkKTtcbn1cblxuZnVuY3Rpb24gcHJvbXB0SWZOb3RMb2dnZWRJbigpOiBib29sZWFuIHtcbiAgaWYgKCFhcHAudXNlci5sb2dnZWRfaW4pIHtcbiAgICBsZXQgcHJvbXB0ID0gbmV3IFByb21wdERpYWxvZyh1aS5wcm9tcHQuc2lnbkluVG9VcGRhdGUpXG4gICAgcHJvbXB0Lm9uQWNjZXB0ID0gZnVuY3Rpb24oKSB7fTtcbiAgICBwcm9tcHQuc2hvdygpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0U2VsZWN0ZWRPckFsbCgpIHtcbiAgbGV0ICRleHRlbnNpb25zID0gJCgnI2V4dGVuc2lvbi1saXN0JykuZmluZGVyU2VsZWN0KCdzZWxlY3RlZCcpO1xuICBpZiAoJGV4dGVuc2lvbnMubGVuZ3RoID09IDApIHtcbiAgICAkZXh0ZW5zaW9ucyA9ICQoJy5lbS1leHRlbnNpb24nKTtcbiAgfVxuICByZXR1cm4gJGV4dGVuc2lvbnM7XG59XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUcmltYmxlIE5hdmlnYXRpb24gTGltaXRlZFxuLy8gQXV0aG9yOiB0aG9tdGhvbUBza2V0Y2h1cC5jb20gKFRob21hcyBUaG9tYXNzZW4pXG5cbmltcG9ydCAqIGFzIEZpbGUgZnJvbSBcIi4vZmlsZVwiO1xuaW1wb3J0IHsgRXh0ZW5zaW9uIH0gZnJvbSAnLi9leHRlbnNpb24nXG5pbXBvcnQgKiBhcyBFeHRlbnNpb25IYW5kbGVyIGZyb20gXCIuL2V4dGVuc2lvbl9oYW5kbGVyXCI7XG5pbXBvcnQgeyBFeHRlbnNpb25SZXN1bHQgYXMgUmVzdWx0IH0gZnJvbSBcIi4vZW51bXNcIjtcbmltcG9ydCB7IEV4dGVuc2lvbk5vdGlmaWNhdGlvblR5cGUgYXMgVHlwZSB9IGZyb20gXCIuL2VudW1zXCI7XG5pbXBvcnQgKiBhcyBFcnJvckRpYWxvZyBmcm9tIFwiLi9lcnJvcl9kaWFsb2dcIjtcblxuZXhwb3J0IHsgRXh0ZW5zaW9uUmVzdWx0IGFzIFJlc3VsdCB9IGZyb20gXCIuL2VudW1zXCI7XG5leHBvcnQgeyBFeHRlbnNpb25Ob3RpZmljYXRpb25UeXBlIGFzIFR5cGUgfSBmcm9tIFwiLi9lbnVtc1wiO1xuXG5cbmV4cG9ydCBpbnRlcmZhY2UgTm90aWZpY2F0aW9uIHtcbiAgZXh0ZW5zaW9uX2lkOiBzdHJpbmcsXG4gIHR5cGU6IFR5cGUsXG4gIHJlc3VsdDogUmVzdWx0LFxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBvbkluc3RhbGwobm90aWZpY2F0aW9uOiBOb3RpZmljYXRpb24pIHtcbiAgLy8gVE9ETyh0aG9tdGhvbSk6IEhpZ2hsaWdodCBuZXcgZXh0ZW5zaW9ucz8gV2UgZG9uJ3QgcmVhbGx5IGtub3cgdGhlXG4gIC8vIGV4dGVuc2lvbl9pZCBvZiBuZXcgZXh0ZW5zaW9ucy4gU28gd2UgY2FuJ3QgbWFwIGFuIGFyY2hpdmUgcGF0aCB0byB0aGVcbiAgLy8gbmV3IGV4dGVuc2lvbi4gV2UgbmVlZCB0byBkZXRlY3QgdGhpcyB3aGVuIHdlIHJlYnVpbGQgdGhlIGV4dGVuc2lvbiBsaXN0LlxuICBpZiAobm90aWZpY2F0aW9uLnJlc3VsdCAhPSBSZXN1bHQua1Jlc3VsdFN1Y2NlZWRlZCkge1xuICAgIGRpc3BsYXlOb3RpZmljYXRpb25FcnJvcihub3RpZmljYXRpb24pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvblVuaW5zdGFsbChub3RpZmljYXRpb246IE5vdGlmaWNhdGlvbikge1xuICBpZiAobm90aWZpY2F0aW9uLnJlc3VsdCAhPSBSZXN1bHQua1Jlc3VsdFN1Y2NlZWRlZCkge1xuICAgIGRpc3BsYXlOb3RpZmljYXRpb25FcnJvcihub3RpZmljYXRpb24pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvblVwZGF0ZShub3RpZmljYXRpb246IE5vdGlmaWNhdGlvbikge1xuICBpZiAobm90aWZpY2F0aW9uLnJlc3VsdCAhPSBSZXN1bHQua1Jlc3VsdFN1Y2NlZWRlZCkge1xuICAgIGRpc3BsYXlOb3RpZmljYXRpb25FcnJvcihub3RpZmljYXRpb24pO1xuICB9XG59XG5cblxuZnVuY3Rpb24gZXJyb3JUeXBlKG5vdGlmaWNhdGlvbjogTm90aWZpY2F0aW9uKTogc3RyaW5nIHtcbiAgbGV0IHRlbXBsYXRlOiBDbG9zdXJlVGVtcGxhdGU7XG4gIHN3aXRjaChub3RpZmljYXRpb24udHlwZSkge1xuICBjYXNlIFR5cGUua0V4dGVuc2lvbkluc3RhbGxlZDpcbiAgICB0ZW1wbGF0ZSA9IHVpLmV4dGVuc2lvbi5lcnJvci5mYWlsZWRJbnN0YWxsO1xuICAgIGJyZWFrO1xuICBjYXNlIFR5cGUua0V4dGVuc2lvblVuaW5zdGFsbGVkOlxuICAgIHRlbXBsYXRlID0gdWkuZXh0ZW5zaW9uLmVycm9yLmZhaWxlZFVuaW5zdGFsbDtcbiAgICBicmVhaztcbiAgY2FzZSBUeXBlLmtFeHRlbnNpb25VcGRhdGVkOlxuICAgIHRlbXBsYXRlID0gdWkuZXh0ZW5zaW9uLmVycm9yLmZhaWxlZFVwZGF0ZTtcbiAgICBicmVhaztcbiAgZGVmYXVsdDpcbiAgICAvLyBUT0RPKHRob210aG9tKTogU2hvdWxkIG5vdCBiZSByZWFjaGVkLiBMb2cgc29tZWhvdy5cbiAgICByZXR1cm4gJyc7XG4gIH1cbiAgbGV0ICRleHRlbnNpb24gPSBFeHRlbnNpb25IYW5kbGVyLmV4dGVuc2lvbkh0bWwobm90aWZpY2F0aW9uLmV4dGVuc2lvbl9pZCk7XG4gIGxldCBuYW1lOiBzdHJpbmc7XG4gIGlmICgkZXh0ZW5zaW9uLmxlbmd0aCA9PT0gMCkge1xuICAgIC8vIElmIHdlIGFyZSB1bmFibGUgdG8gZmluZCBhbiBleHRlbnNpb24gaW4gb3VyIGxpc3QgdGhhdCBtYXRjaCB0aGUgaWQgaW5cbiAgICAvLyB0aGUgbm90aWZpY2F0aW9uIHdlIHVzZSB0aGUgaWQgaXRzZWxmLiBJbiB0aGUgY2FzZSBvZiBpbnN0YWxsaW5nXG4gICAgLy8gZXh0ZW5zaW9ucyB0aGlzIHdpbGwgY29udGFpbiB0aGUgZmlsZW5hbWUuXG4gICAgbmFtZSA9IEZpbGUuYmFzZW5hbWUobm90aWZpY2F0aW9uLmV4dGVuc2lvbl9pZCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gV2hlbiB3ZSBmaW5kIGEgZXh0ZW5zaW9uIGluIHRoZSBsaXN0IHdlIHVzZSB0aGUgZXh0ZW5zaW9uIG5hbWUuXG4gICAgbGV0IGV4dGVuc2lvbjogRXh0ZW5zaW9uID0gJGV4dGVuc2lvbi5kYXRhKCdleHRlbnNpb24nKTtcbiAgICBuYW1lID0gZXh0ZW5zaW9uLm5hbWU7XG4gIH1cbiAgbGV0IGRhdGEgPSB7IGV4dGVuc2lvbk5hbWU6IG5hbWUgfVxuICByZXR1cm4gdGVtcGxhdGUoZGF0YSk7XG59XG5cbmZ1bmN0aW9uIGVycm9yRGV0YWlscyhub3RpZmljYXRpb246IE5vdGlmaWNhdGlvbik6IHN0cmluZyB7XG4gIGxldCB0ZW1wbGF0ZTogQ2xvc3VyZVRlbXBsYXRlO1xuICBzd2l0Y2gobm90aWZpY2F0aW9uLnJlc3VsdCkge1xuICBjYXNlIFJlc3VsdC5rUmVzdWx0RmFpbGVkOlxuICAgIHJldHVybiAnJzsgLy8gTm8gZGV0YWlscyBmb3IgdGhpcyB0eXBlLlxuICBjYXNlIFJlc3VsdC5rUmVzdWx0RmFpbGVkUmVtb3ZlTGljZW5zZTpcbiAgICB0ZW1wbGF0ZSA9IHVpLmV4dGVuc2lvbi5lcnJvci5mYWlsZWRSZW1vdmVMaWNlbnNlO1xuICAgIGJyZWFrO1xuICBjYXNlIFJlc3VsdC5rUmVzdWx0RmFpbGVkUmVtb3ZlRmlsZXM6XG4gICAgdGVtcGxhdGUgPSB1aS5leHRlbnNpb24uZXJyb3IuZmFpbGVkUmVtb3ZlRmlsZXM7XG4gICAgYnJlYWs7XG4gIGNhc2UgUmVzdWx0LmtSZXN1bHRGYWlsZWROb0FyY2hpdmVIYW5kbGVyOlxuICAgIGxldCBmaWxldHlwZSA9IEZpbGUuZXh0bmFtZShub3RpZmljYXRpb24uZXh0ZW5zaW9uX2lkKTtcbiAgICB0ZW1wbGF0ZSA9IHVpLmV4dGVuc2lvbi5lcnJvci5mYWlsZWROb0FyY2hpdmVIYW5kbGVyO1xuICAgIHJldHVybiB0ZW1wbGF0ZSh7IGZpbGV0eXBlOiBmaWxldHlwZSB9KTtcbiAgY2FzZSBSZXN1bHQua1Jlc3VsdEZhaWxlZFdyaXRlQWNjZXNzOlxuICAgIHRlbXBsYXRlID0gdWkuZXh0ZW5zaW9uLmVycm9yLmZhaWxlZFdyaXRlQWNjZXNzO1xuICAgIGJyZWFrO1xuICBjYXNlIFJlc3VsdC5rUmVzdWx0RmFpbGVkRG93bmxvYWQ6XG4gICAgdGVtcGxhdGUgPSB1aS5leHRlbnNpb24uZXJyb3IuZmFpbGVkRG93bmxvYWQ7XG4gICAgYnJlYWs7XG4gIGNhc2UgUmVzdWx0LmtSZXN1bHRGYWlsZWRVcGRhdGVMaWNlbnNlOlxuICAgIHRlbXBsYXRlID0gdWkuZXh0ZW5zaW9uLmVycm9yLmZhaWxlZFVwZGF0ZUxpY2Vuc2U7XG4gICAgYnJlYWs7XG4gIGNhc2UgUmVzdWx0LmtSZXN1bHRGYWlsZWRVcGRhdGVWZXJzaW9uSWQ6XG4gICAgdGVtcGxhdGUgPSB1aS5leHRlbnNpb24uZXJyb3IuZmFpbGVkVXBkYXRlVmVyc2lvbklkO1xuICAgIGJyZWFrO1xuICBjYXNlIFJlc3VsdC5rUmVzdWx0RmFpbGVkQXJjaGl2ZVJlYWQ6XG4gICAgdGVtcGxhdGUgPSB1aS5leHRlbnNpb24uZXJyb3IuZmFpbGVkQXJjaGl2ZVJlYWQ7XG4gICAgYnJlYWs7XG4gIGRlZmF1bHQ6XG4gICAgLy8gTm8gZGV0YWlscyBmb3IgdGhpcyB0eXBlLiBTaG91bGQgbm90IGJlIHJlYWNoZWQuXG4gICAgLy8gVE9ETyh0aG9tdGhvbSk6IExvZyBzb21laG93LlxuICAgIHJldHVybiAnJztcbiAgfVxuICByZXR1cm4gdGVtcGxhdGUoKTtcbn1cblxuY29uc3QgZW51bSBFeHRlbnNpb25FcnJvclR5cGUge1xuICBOb3RpZmljYXRpb24sXG4gIExpY2Vuc2VFcnJvclxufVxuXG4vLyBEYXRhIHN0cnVjdHVyZSBhdHRhY2hlZCB0byB0aGUgZXJyb3IgbGlzdCBpdGVtcyB3aGljaCBtYWtlcyBpdCBwb3NzaWJsZSB0b1xuLy8gbG9vayB1cCBleGlzdGluZyBlcnJvcnMuXG5pbnRlcmZhY2UgRXh0ZW5zaW9uRXJyb3Ige1xuICBleHRlbnNpb25faWQ6IHN0cmluZztcbiAgdHlwZTogRXh0ZW5zaW9uRXJyb3JUeXBlO1xuICBlcnJvcl9jb2RlOiBudW1iZXI7XG4gIGVycm9yX2RldGFpbDogbnVtYmVyO1xufVxuXG5mdW5jdGlvbiBkaXNwbGF5Tm90aWZpY2F0aW9uRXJyb3Iobm90aWZpY2F0aW9uOiBOb3RpZmljYXRpb24pIHtcbiAgbGV0IGV4dGVuc2lvbl9pZCA9IG5vdGlmaWNhdGlvbi5leHRlbnNpb25faWQ7XG4gIGxldCBlcnJvcjogRXh0ZW5zaW9uRXJyb3IgPSB7XG4gICAgZXh0ZW5zaW9uX2lkOiBleHRlbnNpb25faWQsXG4gICAgdHlwZTogRXh0ZW5zaW9uRXJyb3JUeXBlLk5vdGlmaWNhdGlvbixcbiAgICBlcnJvcl9jb2RlOiBub3RpZmljYXRpb24udHlwZSxcbiAgICBlcnJvcl9kZXRhaWw6IG5vdGlmaWNhdGlvbi5yZXN1bHRcbiAgfVxuICAvLyBHZXQgdXNlciBmcmllbmRseSBlcnJvciBtZXNzYWdlcy5cbiAgbGV0IHR5cGUgPSBlcnJvclR5cGUobm90aWZpY2F0aW9uKTtcbiAgbGV0IGRldGFpbHMgPSBlcnJvckRldGFpbHMobm90aWZpY2F0aW9uKTtcbiAgLy8gR2VuZXJhdGUgdGhlIEhUTUwgdGVtcGxhdGUuXG4gIGxldCBwYXJhbXMgPSB7IHR5cGU6IHR5cGUsIGRldGFpbHM6IGRldGFpbHMgfTtcbiAgZGlzcGxheUV4dGVuc2lvbkVycm9yKGVycm9yLCB1aS5leHRlbnNpb24uZXJyb3IuaHRtbCwgcGFyYW1zKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRpc3BsYXlMaWNlbnNlRXJyb3IoZXh0ZW5zaW9uOiBFeHRlbnNpb24pIHtcbiAgbGV0IGV4dGVuc2lvbl9pZCA9IGV4dGVuc2lvbi5sb2NhbF9pZDtcbiAgbGV0IGVycm9yOiBFeHRlbnNpb25FcnJvciA9IHtcbiAgICBleHRlbnNpb25faWQ6IGV4dGVuc2lvbl9pZCxcbiAgICB0eXBlOiBFeHRlbnNpb25FcnJvclR5cGUuTGljZW5zZUVycm9yLFxuICAgIGVycm9yX2NvZGU6IGV4dGVuc2lvbi5saWNlbnNlLnN0YXRlLFxuICAgIGVycm9yX2RldGFpbDogMCAvLyBEb2Vzbid0IGhhdmUgZGV0YWlsIHN0YXRlcy5cbiAgfVxuICAvLyBHZXQgdXNlciBmcmllbmRseSBlcnJvciBtZXNzYWdlcy5cbiAgbGV0IHR5cGUgPSB1aS5leHRlbnNpb24uZXJyb3IubGljZW5zZUVycm9yVGl0bGUoXG4gICAgICB7IGV4dGVuc2lvbk5hbWU6IGV4dGVuc2lvbi5uYW1lIH0pO1xuICBsZXQgZGV0YWlscyA9IHVpLmV4dGVuc2lvbi5lcnJvci5saWNlbnNlRXJyb3JEZXNjcmlwdGlvbihcbiAgICAgIHsgc3RhdGU6IGV4dGVuc2lvbi5saWNlbnNlLnN0YXRlIH0pO1xuICAvLyBHZW5lcmF0ZSB0aGUgSFRNTCB0ZW1wbGF0ZS5cbiAgbGV0IHBhcmFtcyA9IHsgdHlwZTogdHlwZSwgZGV0YWlsczogZGV0YWlscyB9O1xuICBkaXNwbGF5RXh0ZW5zaW9uRXJyb3IoZXJyb3IsIHVpLmV4dGVuc2lvbi5lcnJvci5odG1sLCBwYXJhbXMpO1xufVxuXG5mdW5jdGlvbiBlcnJvckV4aXN0KCRleHRlbnNpb246IEpRdWVyeSwgZXJyb3I6IEV4dGVuc2lvbkVycm9yKTogYm9vbGVhbiB7XG4gIGxldCAkZXJyb3JzID0gJGV4dGVuc2lvbi5maW5kKCcuZXh0ZW5zaW9uLWVycm9yLWJhZyAuZXh0ZW5zaW9uLWVycm9yLWl0ZW0nKTtcbiAgbGV0ICRleGlzdGluZyA9ICRlcnJvcnMuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgIGxldCAkZXJyb3IgPSAkKHRoaXMpO1xuICAgIGxldCBjdXJyZW50RXJyb3I6IEV4dGVuc2lvbkVycm9yID0gJGVycm9yLmRhdGEoJ2V4dGVuc2lvbi1lcnJvcicpO1xuICAgIGlmIChjdXJyZW50RXJyb3IudHlwZSA9PT0gZXJyb3IudHlwZSAmJlxuICAgICAgICBjdXJyZW50RXJyb3IuZXJyb3JfY29kZSA9PT0gZXJyb3IuZXJyb3JfY29kZSAmJlxuICAgICAgICBjdXJyZW50RXJyb3IuZXJyb3JfZGV0YWlsID09PSBlcnJvci5lcnJvcl9kZXRhaWwpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pO1xuICByZXR1cm4gJGV4aXN0aW5nLmxlbmd0aCA+IDA7XG59XG5cbi8vIExpY2Vuc2UgZXJyb3JzIGFyZSBhZGRlZCB3aGVuIHRoZSBleHRlbnNpb24gbGlzdCBpcyB1cGRhdGVkLiBXZSBuZWVkIHRvIGNhbGxcbi8vIHRoaXMgd2hlbiBpdCB1cGRhdGVzIGluIG9yZGVyIHRvIGF2b2lkIGRpc3BsYXlpbmcgc3RhbGUgbGljZW5zZSBlcnJvcnMgdGhhdFxuLy8gYXJlIG5vIGxvbmdlciByZWxldmFudC5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVMaWNlbnNlRXJyb3JzKGV4dGVuc2lvbjogRXh0ZW5zaW9uKTogdm9pZCB7XG4gIGxldCAkZXh0ZW5zaW9uID0gRXh0ZW5zaW9uSGFuZGxlci5leHRlbnNpb25IdG1sKGV4dGVuc2lvbi5sb2NhbF9pZCk7XG4gIGxldCAkZXJyb3JzID0gJGV4dGVuc2lvbi5maW5kKCcuZXh0ZW5zaW9uLWVycm9yLWJhZyAuZXh0ZW5zaW9uLWVycm9yLWl0ZW0nKTtcbiAgJGVycm9ycy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgIGxldCAkZXJyb3IgPSAkKHRoaXMpO1xuICAgIGxldCBjdXJyZW50RXJyb3I6IEV4dGVuc2lvbkVycm9yID0gJGVycm9yLmRhdGEoJ2V4dGVuc2lvbi1lcnJvcicpO1xuICAgIGlmIChjdXJyZW50RXJyb3IudHlwZSA9PSBFeHRlbnNpb25FcnJvclR5cGUuTGljZW5zZUVycm9yKSB7XG4gICAgICAkZXJyb3IuZGV0YWNoKCk7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gZGlzcGxheUV4dGVuc2lvbkVycm9yKGVycm9yOiBFeHRlbnNpb25FcnJvcixcbiAgICB0ZW1wbGF0ZTogQ2xvc3VyZVRlbXBsYXRlLCBkYXRhOiBhbnkpIHtcbiAgbGV0IGZyYWdtZW50ID0gc295LnJlbmRlckFzRnJhZ21lbnQodWkuZXh0ZW5zaW9uLmVycm9yLmh0bWwsIGRhdGEpO1xuICAvLyBBdHRhY2ggdGhlIG5vdGlmaWNhdGlvbiBkYXRhIHRvIHRoZSBlbGVtZW50IHNvIHdlIGNhbiBsb2NhdGUgdGhlbSBsYXRlciBvblxuICAvLyBpZiB3ZSB3YW4ndCB0byByZW1vdmUgYW4gaXRlbSB3aGljaCBpc24ndCByZWxldmFudCBhbnkgbW9yZS5cbiAgJChmcmFnbWVudCkuZGF0YSgnZXh0ZW5zaW9uLWVycm9yJywgZXJyb3IpO1xuICAvLyBBZGQgdGhlIGVycm9yIHRvIHRoZSBsaXN0LlxuICBsZXQgJGV4dGVuc2lvbiA9IEV4dGVuc2lvbkhhbmRsZXIuZXh0ZW5zaW9uSHRtbChlcnJvci5leHRlbnNpb25faWQpO1xuICBpZiAoJGV4dGVuc2lvbi5sZW5ndGggPT09IDApIHtcbiAgICAvLyBTb21lIGVycm9ycyBjYW5ub3QgYmUgZGlzcGxheWVkIGNvbnRleHR1YWxseSB3aXRoIGFuIGV4dGVuc2lvbiAtIGFzIGluXG4gICAgLy8gdGhlIGNhc2Ugb2YgaW5zdGFsbGluZyBhIG5ldyBleHRlbnNpb25zLiBGb3IgdGhpcyB3ZSBtdXN0IGRpc3BsYXkgYVxuICAgIC8vIGRpYWxvZy5cbiAgICBFcnJvckRpYWxvZy5zaG93RXJyb3IoZnJhZ21lbnQpO1xuICB9IGVsc2Uge1xuICAgIC8vIEZvciBhY3Rpb25zIHN1Y2ggYXMgdXBkYXRlL3VuaW5zdGFsbCB3ZSBkaXNwbGF5IHRoZSBlcnJvciBpbiBjb250ZXh0IG9mXG4gICAgLy8gdGhlIGV4dGVuc2lvbiBpbiB0aGUgZXh0ZW5zaW9uIGxpc3QuXG4gICAgaWYgKCFlcnJvckV4aXN0KCRleHRlbnNpb24sIGVycm9yKSkge1xuICAgICAgbGV0ICRlcnJvcnMgPSAkZXh0ZW5zaW9uLmZpbmQoJy5leHRlbnNpb24tZXJyb3ItYmFnJyk7XG4gICAgICAkZXJyb3JzLmFwcGVuZChmcmFnbWVudCk7XG4gICAgfVxuICB9XG59XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUcmltYmxlIE5hdmlnYXRpb24gTGltaXRlZFxyXG4vLyBBdXRob3I6IHRob210aG9tQHNrZXRjaHVwLmNvbSAoVGhvbWFzIFRob21hc3NlbilcclxuXHJcbmltcG9ydCB7IGFwcCB9IGZyb20gXCIuL2FwcFwiO1xyXG5pbXBvcnQgeyBFeHRlbnNpb24gfSBmcm9tIFwiLi9leHRlbnNpb25cIjtcclxuaW1wb3J0IHsgQ29tcGxpYW5jZU1vZGUgfSBmcm9tIFwiLi9lbnVtc1wiO1xyXG5pbXBvcnQgeyBTaWduZWRTdGF0dXMgfSBmcm9tIFwiLi9lbnVtc1wiO1xyXG5pbXBvcnQgeyB1cGRhdGVUb2dnbGVCdXR0b25zIH0gZnJvbSBcIi4vdXRpbGl0aWVzXCI7XHJcblxyXG5cclxuZnVuY3Rpb24gSXNTaWduZWQoZXh0ZW5zaW9uOiBFeHRlbnNpb24pIDogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGV4dGVuc2lvbi5zaWduZWQgPT0gU2lnbmVkU3RhdHVzLmtWYWxpZFNpZ25hdHVyZTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhbGxvd2VkVG9Mb2FkKGV4dGVuc2lvbjogRXh0ZW5zaW9uKSB7XHJcbiAgc3dpdGNoIChhcHAuY29uZmlnLnNlY3VyaXR5X3BvbGljeSkge1xyXG4gICAgY2FzZSBDb21wbGlhbmNlTW9kZS5rQ29tcGF0aWJpbGl0eTpcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICBjYXNlIENvbXBsaWFuY2VNb2RlLmtQcm9tcHQ6XHJcbiAgICAgIHJldHVybiBJc1NpZ25lZChleHRlbnNpb24pIHx8IGV4dGVuc2lvbi5hcHByb3ZlZDtcclxuICAgIGNhc2UgQ29tcGxpYW5jZU1vZGUua0NlcnRpZmllZDpcclxuICAgICAgcmV0dXJuIElzU2lnbmVkKGV4dGVuc2lvbik7XHJcbiAgfVxyXG4gIHJldHVybiBmYWxzZTsgLy8gVGhpcyB3b3VsZCBiZSBhbiBlcnJvci5cclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBibG9ja2VkRnJvbUxvYWRpbmcoZXh0ZW5zaW9uOiBFeHRlbnNpb24pIHtcclxuICByZXR1cm4gIWFsbG93ZWRUb0xvYWQoZXh0ZW5zaW9uKTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVUcnVzdFN0YXRlKCk6IHZvaWQge1xyXG4gIGxldCAkZXh0ZW5zaW9ucyA9ICQoJy5lbS1leHRlbnNpb24nKTtcclxuICAkZXh0ZW5zaW9ucy5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgbGV0ICRleHRlbnNpb24gPSAkKHRoaXMpO1xyXG4gICAgbGV0IGV4dGVuc2lvbjogRXh0ZW5zaW9uID0gJGV4dGVuc2lvbi5kYXRhKCdleHRlbnNpb24nKTtcclxuICAgICRleHRlbnNpb24ucmVtb3ZlQ2xhc3MoJ2V4dGVuc2lvbi1ub3QtdHJ1c3RlZCBleHRlbnNpb24tYmxvY2tlZCcpO1xyXG4gICAgc3dpdGNoIChhcHAuY29uZmlnLnNlY3VyaXR5X3BvbGljeSkge1xyXG4gICAgY2FzZSBDb21wbGlhbmNlTW9kZS5rUHJvbXB0OlxyXG4gICAgICBpZiAoIWV4dGVuc2lvbi5hcHByb3ZlZCkge1xyXG4gICAgICAgICRleHRlbnNpb24uYWRkQ2xhc3MoJ2V4dGVuc2lvbi1ub3QtdHJ1c3RlZCcpO1xyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBDb21wbGlhbmNlTW9kZS5rQ2VydGlmaWVkOlxyXG4gICAgICBpZiAoIUlzU2lnbmVkKGV4dGVuc2lvbikpIHtcclxuICAgICAgICAkZXh0ZW5zaW9uLmFkZENsYXNzKCdleHRlbnNpb24tYmxvY2tlZCcpO1xyXG4gICAgICAgIC8vIFRPRE8odGhvbXRob20pOiBBZGQgaW5kaWNhdGlvbiBvZiBzaWduaW5nIHN0YXR1cyBkZXRhaWxzLlxyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHVwZGF0ZVRvZ2dsZUJ1dHRvbnMoKTtcclxufVxyXG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUcmltYmxlIE5hdmlnYXRpb24gTHRkLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy8gQXV0aG9yOiB0aG9tdGhvbUBza2V0Y2h1cC5jb20gKFRob21hcyBUaG9tYXNzZW4pXG5cbmltcG9ydCB7IGFwcCB9IGZyb20gXCIuL2FwcFwiO1xuaW1wb3J0IHsgQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyBTaWduZWRTdGF0dXMgfSBmcm9tIFwiLi9lbnVtc1wiO1xuaW1wb3J0IHsgRXh0ZW5zaW9uIH0gZnJvbSBcIi4vZXh0ZW5zaW9uXCI7XG5pbXBvcnQgeyBFeHRlbnNpb25MaWNlbnNlU3RhdGUgfSBmcm9tIFwiLi9leHRlbnNpb25fbGljZW5zZVwiO1xuaW1wb3J0ICogYXMgRXh0ZW5zaW9uSGFuZGxlciBmcm9tIFwiLi9leHRlbnNpb25faGFuZGxlclwiO1xuaW1wb3J0ICogYXMgRXh0ZW5zaW9uTm90aWZpY2F0aW9uIGZyb20gXCIuL2V4dGVuc2lvbl9ub3RpZmljYXRpb25cIjtcbmltcG9ydCAqIGFzIEV4dGVuc2lvblBvbGljaWVzIGZyb20gXCIuL2V4dGVuc2lvbl9wb2xpY2llc1wiO1xuaW1wb3J0IHsgdXBkYXRlVG9nZ2xlQnV0dG9ucyB9IGZyb20gXCIuL3V0aWxpdGllc1wiO1xuaW1wb3J0IHsgVXNlciB9IGZyb20gXCIuL3VzZXJcIjtcblxuXG50eXBlIEV4dGVuc2lvbkxpc3QgPSB7IGV4dGVuc2lvbnM6IEV4dGVuc2lvbltdIH07XG50eXBlIE5vdGlmaWNhdGlvbkRhdGEgPSB7IG5vdGlmaWNhdGlvbjogRXh0ZW5zaW9uTm90aWZpY2F0aW9uLk5vdGlmaWNhdGlvbjsgfTtcbnR5cGUgQ29uZmlnRGF0YSA9IHsgY29uZmlnOiBDb25maWc7IH07XG50eXBlIFVzZXJEYXRhID0geyB1c2VyOiBVc2VyOyB9O1xuXG4vLyBXZSBhZGQgcHJvcGVydGllcyB0byB0aGUgd2luZG93IG9iamVjdCBpbiBvcmRlciB0byBjcmVhdGUgZ2xvYmFsIGhvb2tzIHdoaWNoXG4vLyBTa2V0Y2hVcCBjYW4gY2FsbCBmcm9tIHRoZSBDKysgc2lkZS5cbi8vXG4vLyBUaGVzZSBmdW5jdGlvbnMgYXJlIGNhbGxlZCBmcm9tIG91dHNpZGUgdGhlIFdlYkRpYWxvZy4gKExpa2UgUnVieSBvciBDKyspLlxuLy8gQmUgY2FyZWZ1bCByZW5hbWluZyBvciBjaGFuZ2luZyB0aGVzZS5cbndpbmRvdy5FeHRlbnNpb25NYW5hZ2VyID0ge1xuXG4gIC8vIEFuIEV4dGVuc2lvbkxpc3ROb3RpZmljYXRpb24gZm9yd2FyZGVkIGJ5IEV4dGVuc2lvbk1hbmFnZXJEaWFsb2cuXG4gIG9uRXh0ZW5zaW9uTGlzdFVwZGF0ZShkYXRhOiBFeHRlbnNpb25MaXN0KSB7XG4gICAgbGV0ICRleHRlbnNpb25zTGlzdCA9ICQoJyNleHRlbnNpb24tbGlzdCcpO1xuXG4gICAgLy8gVE9ETyh0aG9tdGhvbSk6IFdlIHByb2JhYmx5IHdhbnQgZGlmZmVyZW50IHNvcnRpbmcgb3B0aW9ucyBldmVudHVhbGx5LlxuICAgIC8vIFRoaXMgc2hvdWxkIGJlIHJlcGxhY2VkIHdpdGggYSBmdW5jdGlvbiB0aGF0IHJldHVybiB0aGUgZXh0ZW5zaW9ucyBpblxuICAgIC8vIHRoZSBvcmRlciB0aGUgdXNlciBoYXMgY2hvc2VuLlxuICAgIGxldCBzb3J0ZWRFeHRlbnNpb25zID0gZGF0YS5leHRlbnNpb25zLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgcmV0dXJuIGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XG4gICAgfSk7XG5cbiAgICAvLyBSZW1vdmVzIGV4dGVuc2lvbnMgdGhhdCBoYXZlIGJlZW4gcmVtb3ZlZCBkdWUgdG8gdW5pbnN0YWxsLlxuICAgIHB1cmdlRXh0ZW5zaW9ucygkZXh0ZW5zaW9uc0xpc3QsIHNvcnRlZEV4dGVuc2lvbnMpO1xuXG4gICAgbGV0IG51bVVwZGF0ZXMgPSAwO1xuXG4gICAgLy8gUG9wdWxhdGUgdGhlIGV4dGVuc2lvbiBsaXN0IGluIHRoZSBzYW1lIG9yZGVyIGFzIHdlIHNvcnRlZCBpdC5cbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgc29ydGVkRXh0ZW5zaW9ucy5sZW5ndGg7ICsraW5kZXgpIHtcbiAgICAgIGxldCBleHRlbnNpb24gPSBzb3J0ZWRFeHRlbnNpb25zW2luZGV4XTtcbiAgICAgIHVwZGF0ZU9yQWRkKCRleHRlbnNpb25zTGlzdCwgaW5kZXgsIGV4dGVuc2lvbik7XG5cbiAgICAgIGlmIChoYXZlTGljZW5zZUVycm9ycyhleHRlbnNpb24pKSB7XG4gICAgICAgIEV4dGVuc2lvbk5vdGlmaWNhdGlvbi5kaXNwbGF5TGljZW5zZUVycm9yKGV4dGVuc2lvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBFeHRlbnNpb25Ob3RpZmljYXRpb24ucmVtb3ZlTGljZW5zZUVycm9ycyhleHRlbnNpb24pO1xuICAgICAgfVxuXG4gICAgICAvLyBJbmRpY2F0ZSB0byB0aGUgdXNlciBob3cgbWFueSB1cGRhdGVzIGFyZSBhdmFpbGFibGUgaW4gdG90YWwuXG4gICAgICBpZiAoZXh0ZW5zaW9uLnVwZGF0ZV9hdmFpbGFibGUpXG4gICAgICAgICsrbnVtVXBkYXRlcztcbiAgICB9O1xuXG4gICAgLy8gTWFrZSBzdXJlIHRvIHVwZGF0ZSB0aGUgVUkgYXZhaWxpYmxlIGRlcGVuZGluZyBvbiB0aGUgc2VjdXJpdHkgbW9kZVxuICAgIC8vIGFuZCB0aGUgc2lnbmVkL3RydXN0ZWQgc3RhdGVkIG9mIHRoZSBleHRlbnNpb24uXG4gICAgRXh0ZW5zaW9uUG9saWNpZXMudXBkYXRlVHJ1c3RTdGF0ZSgpO1xuXG4gICAgLy8gTWFrZSBzdXJlIHRvIGhvb2sgdXAgZXZlbnRzIG9uIHNvbWUgY29udHJvbHMgdGhhdCBkb2Vzbid0IGhhdmUgbGl2ZVxuICAgIC8vIHNlbGVjdG9ycyB0aGF0IHVwZGF0ZSBkeW5hbWljYWxseS5cbiAgICB1cGRhdGVUb2dnbGVCdXR0b25zKCk7XG5cbiAgICAvLyBJZiB0aGVyZSBhcmUgbm8gdXBkYXRlcyB3ZSBkb24ndCB3YW50IHRvIGRpc3BsYXkgYW55IG51bWJlciBpbiB0aGUgYmFkZ2UuXG4gICAgJCgnI3RhYi1tYW5hZ2UgLmJhZGdlJykudGV4dChudW1VcGRhdGVzIHx8ICcnKTtcbiAgfSxcblxuXG4gIC8vIEFuIEV4dGVuc2lvbk5vdGlmaWNhdGlvbiBmb3J3YXJkZWQgYnkgRXh0ZW5zaW9uTWFuYWdlckRpYWxvZy5cbiAgb25FeHRlbnNpb25Ob3RpZmljYXRpb24oZGF0YTogTm90aWZpY2F0aW9uRGF0YSkge1xuICAgIGxldCBub3RpZmljYXRpb24gPSBkYXRhLm5vdGlmaWNhdGlvbjtcbiAgICBzd2l0Y2ggKG5vdGlmaWNhdGlvbi50eXBlKSB7XG4gICAgY2FzZSBFeHRlbnNpb25Ob3RpZmljYXRpb24uVHlwZS5rRXh0ZW5zaW9uSW5zdGFsbGVkOlxuICAgICAgRXh0ZW5zaW9uTm90aWZpY2F0aW9uLm9uSW5zdGFsbChub3RpZmljYXRpb24pO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBFeHRlbnNpb25Ob3RpZmljYXRpb24uVHlwZS5rRXh0ZW5zaW9uVW5pbnN0YWxsZWQ6XG4gICAgICBFeHRlbnNpb25Ob3RpZmljYXRpb24ub25Vbmluc3RhbGwobm90aWZpY2F0aW9uKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgRXh0ZW5zaW9uTm90aWZpY2F0aW9uLlR5cGUua0V4dGVuc2lvblVwZGF0ZWQ6XG4gICAgICBFeHRlbnNpb25Ob3RpZmljYXRpb24ub25VcGRhdGUobm90aWZpY2F0aW9uKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfSxcblxuXG4gIC8vIEEgY29uZmlndXJhdGlvbiBvYmplY3Qgc2VudCBieSB0aGUgRXh0ZW5zaW9uIE1hbmFnZXIgZGlhbG9nLlxuICBvbkNvbmZpZ1VwZGF0ZShkYXRhOiBDb25maWdEYXRhKSB7XG4gICAgYXBwLmNvbmZpZyA9IGRhdGEuY29uZmlnO1xuICB9LFxuXG4gIC8vIEEgbm90aWZpY2F0aW9uIHNlbnQgYnkgdGhlIEV4dGVuc2lvbiBNYW5hZ2VyIGRpYWxvZyB3aGVuIHRoZSB1c2VyIHNpZ24gaW5cbiAgLy8gb3Igb3V0LlxuICBvblVzZXJVcGRhdGUoZGF0YTogVXNlckRhdGEpIHtcbiAgICBhcHAudXNlciA9IGRhdGEudXNlcjtcbiAgfVxuXG59O1xuXG5cbi8vIFRPRE8odGhvbXRob20pOiBNaWdodCBiZSB3b3J0aCBtb3ZpbmcgdGhlc2UgZnVuY3Rpb24gdG8gYSBzZXBhcmF0ZSBtb2R1bGUgaW5cbi8vIG9yZGVyIHRvIGtlZXAgdGhpcyBmaWxlIGFzIGEgc21hbGwgZGVsZWdhdGUuXG5cbi8vIFJlbW92ZXMgZXh0ZW5zaW9ucyBmcm9tIHRoZSBVSSBpZiB0aGV5IGRvbid0IGhhdmUgYSBtYXRjaCBpbiB0aGUgcHJvdmlkZWRcbi8vIGV4dGVuc2lvbiBhcnJheS5cbmZ1bmN0aW9uIHB1cmdlRXh0ZW5zaW9ucyhwYXJlbnQ6IEpRdWVyeSwgZXh0ZW5zaW9uczogRXh0ZW5zaW9uW10pOiB2b2lkIHtcbiAgbGV0IGlkcyA9IGV4dGVuc2lvbnMubWFwKGZ1bmN0aW9uKGV4dGVuc2lvbikge1xuICAgIHJldHVybiBleHRlbnNpb24ubG9jYWxfaWQ7XG4gIH0pO1xuICBwYXJlbnQuZmluZCgnLmVtLWV4dGVuc2lvbicpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgbGV0ICRleHRlbnNpb24gPSAkKHRoaXMpO1xuICAgIGxldCBleHRlbnNpb24gPSAkZXh0ZW5zaW9uLmRhdGEoJ2V4dGVuc2lvbicpO1xuICAgIGlmIChpZHMuaW5kZXhPZihleHRlbnNpb24ubG9jYWxfaWQpIDwgMCkge1xuICAgICAgJGV4dGVuc2lvbi5kZXRhY2goKTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiByZW1vdmVBbGVydENsYXNzKCRlbGVtZW50OiBKUXVlcnkpOiB2b2lkIHtcbiAgJGVsZW1lbnQucmVtb3ZlQ2xhc3MoZnVuY3Rpb24oaW5kZXgsIGNzcykge1xuICAgIHJldHVybiAoY3NzLm1hdGNoICgvKF58XFxzKWFsZXJ0LVxcUysvZykgfHwgW10pLmpvaW4oJyAnKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVNpZ25lZENsYXNzKCRlbGVtZW50OiBKUXVlcnksIHNpZ25lZDogU2lnbmVkU3RhdHVzKTogdm9pZCB7XG4gIHJlbW92ZUFsZXJ0Q2xhc3MoJGVsZW1lbnQpO1xuICAvLyBUaGUgdGVtcGxhdGUgY2xhc3MgZG9lc24ndCByZXR1cm4gYSBzdHJpbmcsIG11c3QgY2FzdCB0byBvbmUgaW4gb3JkZXIgZm9yXG4gIC8vIC5hZGRDbGFzcyB0byB3b3JrLlxuICBsZXQga2xhc3MgPSBTdHJpbmcodWkuZXh0ZW5zaW9uLnNpZ25lZFN0YXR1c0NsYXNzKHsgc2lnbmVkOiBzaWduZWQgfSkpO1xuICAkZWxlbWVudC5hZGRDbGFzcyhrbGFzcyk7XG59XG5cbi8vIEVuc3VyZXMgdGhhdCBhbiBleHRlbnNpb24gbGlzdCBpdGVtIGV4aXN0IGZvciB0aGUgZ2l2ZW4gZXh0ZW5zaW9uLlxuLy8gVXBkYXRlcyBleGlzdGluZyBpdGVtcyBvciBhZGRzIGEgbmV3IG9uZS5cbmZ1bmN0aW9uIHVwZGF0ZU9yQWRkKHBhcmVudDogSlF1ZXJ5LCBpbmRleDogbnVtYmVyLCBleHRlbnNpb246IEV4dGVuc2lvbik6IHZvaWQge1xuICBsZXQgJGV4dGVuc2lvbiA9IEV4dGVuc2lvbkhhbmRsZXIuZXh0ZW5zaW9uSHRtbChleHRlbnNpb24ubG9jYWxfaWQpO1xuICAvLyBVcGRhdGUgZXhpc3RpbmcgZWxlbWVudHMgb3IgYWRkIG5ldyBpdGVtcy5cbiAgaWYgKCRleHRlbnNpb24ubGVuZ3RoID4gMCkge1xuICAgIC8vICRleHRlbnNpb24uY3NzKCdiYWNrZ3JvdW5kJywgJyNlZmUnKTsgLy8gRW5hYmxlIGZvciB2aXN1YWwgZGVidWdnaW5nLlxuXG4gICAgLy8gVE9ETyh0aG9tdGhvbSk6IEF0IHRoZSBtb21lbnQgd2Ugb25seSBzb3J0IGJ5IGV4dGVuc2lvbiBuYW1lLiBXaGVuIHdlXG4gICAgLy8gYWxsb3cgdGhlIHVzZXIgdG8gY2hhbmdlIHdoYXQgdG8gc29ydCBieSB3ZSBtaWdodCBoYXZlIHRvIGRvIHNvbWUgY2hlY2tzXG4gICAgLy8gaGVyZSBhcyB3ZWxsIHRvIGVuc3VyZSB1cGRhdGVkIGVsZW1lbnRzIGFyZSBpbiBjb3JyZWN0IG9yZGVyLlxuXG4gICAgLy8gVGhpcyBpcyBzb21ld2hhdCBmaWRkbHkuIFdvdWxkIGhhdmUgYmVlbiBiZXR0ZXIgaWYgd2Ugd2VyZSB1c2luZyBhIHN5c3RlbVxuICAgIC8vIHRoYXQgY291bGQgYmluZCB2YWx1ZXMgYmV0d2VlbiBvYmplY3RzIGFuZCBIVE1MIC0gc2F2aW5nIHVzIGZyb20gdGhpc1xuICAgIC8vIG1hbnVhbCBzeW5jaW5nLlxuICAgIGxldCBleHRlbnNpb25TdGF0dXMgPSBTdHJpbmcoXG4gICAgICAgIHVpLmV4dGVuc2lvbi5zaWduZWRTdGF0dXMoeyBzaWduZWQ6IGV4dGVuc2lvbi5zaWduZWQgfSkpO1xuICAgICRleHRlbnNpb24uZmluZCgnLmV4dGVuc2lvbi1uYW1lJykudGV4dChleHRlbnNpb24ubmFtZSk7XG4gICAgJGV4dGVuc2lvbi5maW5kKCcuZXh0ZW5zaW9uLWNyZWF0b3InKS50ZXh0KGV4dGVuc2lvbi5jcmVhdG9yKTtcbiAgICAkZXh0ZW5zaW9uLmZpbmQoJy5leHRlbnNpb24tdmVyc2lvbicpLnRleHQoZXh0ZW5zaW9uLnZlcnNpb24pO1xuICAgICRleHRlbnNpb24uZmluZCgnLmV4dGVuc2lvbi1jb3B5cmlnaHQnKS50ZXh0KGV4dGVuc2lvbi5jb3B5cmlnaHQpO1xuICAgICRleHRlbnNpb24uZmluZCgnLmV4dGVuc2lvbi1kZXNjcmlwdGlvbicpLnRleHQoZXh0ZW5zaW9uLmRlc2NyaXB0aW9uKTtcbiAgICAkZXh0ZW5zaW9uLmZpbmQoJy5leHRlbnNpb24tc2lnbmVkJykuaHRtbChleHRlbnNpb25TdGF0dXMpO1xuXG4gICAgbGV0ICRzaWduYXR1cmUgPSAkZXh0ZW5zaW9uLmZpbmQoJy5leHRlbnNpb24tc2lnbmF0dXJlLWJhZGdlIC5hbGVydCcpO1xuICAgIHVwZGF0ZVNpZ25lZENsYXNzKCRzaWduYXR1cmUsIGV4dGVuc2lvbi5zaWduZWQpO1xuXG4gICAgJGV4dGVuc2lvbi5maW5kKCcuY21kLXVwZGF0ZS1leHRlbnNpb24nKVxuICAgICAgICAucHJvcCgnZGlzYWJsZWQnLCAhZXh0ZW5zaW9uLnVwZGF0ZV9hdmFpbGFibGUpO1xuXG4gICAgJGV4dGVuc2lvbi5maW5kKCcuY21kLXVuaW5zdGFsbC1leHRlbnNpb24nKVxuICAgICAgICAucHJvcCgnZGlzYWJsZWQnLCAhZXh0ZW5zaW9uLmNhbl91bmluc3RhbGwpO1xuXG4gICAgJGV4dGVuc2lvbi5maW5kKCcuZXh0ZW5zaW9uLWVuYWJsZSBpbnB1dCcpXG4gICAgICAgIC5wcm9wKCdjaGVja2VkJywgZXh0ZW5zaW9uLmxvYWRlZCk7XG5cbiAgICBpZiAoZXh0ZW5zaW9uLnRodW1ibmFpbF91cmwubGVuZ3RoID4gMCkge1xuICAgICAgJGV4dGVuc2lvbi5maW5kKCcuZXh0ZW5zaW9uLXRodW1ibmFpbCcpXG4gICAgICAgICAgLmF0dHIoJ3NyYycsIGV4dGVuc2lvbi50aHVtYm5haWxfdXJsKTtcbiAgICB9XG5cbiAgICAvLyBUT0RPKHRob210aG9tKTogVXBkYXRlIGluZm8gYWJvdXQgd2hvIHNpZ25lZCB0aGUgZXh0ZW5zaW9uIHdoZW4gd2UgaGF2ZVxuICAgIC8vIGEgd2F5IHRvIGRvIHRoYXQuXG4gIH0gZWxzZSB7XG4gICAgLy8gVGhpcyB3aWxsIGNvbXBpbGUgdGhlIEhUTUwgZnJvbSB0aGUgdGVtcGxhdGUgYW5kIGNyZWF0ZSBhbiB1bmF0dGFjaGVkXG4gICAgLy8gSFRNTCBlbGVtZW50LlxuICAgIGxldCBmcmFnbWVudCA9IHNveS5yZW5kZXJBc0ZyYWdtZW50KHVpLmV4dGVuc2lvbi5odG1sLCBleHRlbnNpb24pO1xuICAgICRleHRlbnNpb24gPSAkKGZyYWdtZW50KTtcbiAgICAvLyBJbnNlcnQgYXQgdGhlIGdpdmVuIHBvc2l0aW9uLlxuICAgIGxldCAkZXh0ZW5zaW9ucyA9IHBhcmVudC5maW5kKCcuZW0tZXh0ZW5zaW9uJyk7XG4gICAgbGV0ICRleGlzdGluZ0l0ZW0gPSAkZXh0ZW5zaW9ucy5lcShpbmRleCk7XG4gICAgaWYgKCRleGlzdGluZ0l0ZW0ubGVuZ3RoID4gMCkge1xuICAgICAgJGV4aXN0aW5nSXRlbS5iZWZvcmUoJGV4dGVuc2lvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcmVudC5hcHBlbmQoJGV4dGVuc2lvbik7XG4gICAgfVxuICAgIC8vIFByZXZlbnQgY2VydGFpbiBhcmVhcyBvZiB0aGUgZXh0ZW5zaW9uIGxpc3QgZnJvbSB0cmlnZ2VyaW5nXG4gICAgLy8gc2VsZWN0IGNoYW5nZS4gVGhpcyBtdXN0IGJlIGRvbmUgbGlrZSB0aGlzIGluc3RlYWQgb2YgYSBnbG9iYWwgbGlzdGVuZXJcbiAgICAvLyBiZWNhdXNlIG90aGVyd2lzZSBpdCB3b24ndCBwcmV2ZW50IGJ1YmJsaW5nLlxuICAgICRleHRlbnNpb24uZmluZCgnLm5vLXNlbGVjdCcpLm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcbiAgfVxuICAvLyBTdG9yZSB0aGUgd2hvbGUgZXh0ZW5zaW9uIGRhdGEgb2JqZWN0IGFsb25nIHdpdGggdGhlIHRhYmxlIHJvdyBzbyBpdFxuICAvLyBjYW4gYmUgZWFzaWx5IGFjY2Vzc2VkIHdoZW4gdGhlIHVzZXIgaW50ZXJhY3RzIHdpdGggaXQuXG4gICRleHRlbnNpb24uZGF0YSgnZXh0ZW5zaW9uJywgZXh0ZW5zaW9uKTtcbn1cblxuZnVuY3Rpb24gaGF2ZUxpY2Vuc2VFcnJvcnMoZXh0ZW5zaW9uOiBFeHRlbnNpb24pOiBib29sZWFuIHtcbiAgaWYgKCFleHRlbnNpb24gfHwgIWV4dGVuc2lvbi5saWNlbnNlKVxuICAgIHJldHVybiBmYWxzZTtcbiAgc3dpdGNoIChleHRlbnNpb24ubGljZW5zZS5zdGF0ZSkge1xuICAgIGNhc2UgRXh0ZW5zaW9uTGljZW5zZVN0YXRlLmtFeHRlbnNpb25MaWNlbnNlU3RhdGVfTGljZW5zZWQ6XG4gICAgY2FzZSBFeHRlbnNpb25MaWNlbnNlU3RhdGUua0V4dGVuc2lvbkxpY2Vuc2VTdGF0ZV9UcmlhbDpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cbiIsIi8vIENvcHlyaWdodCAyMDE2IFRyaW1ibGUgTmF2aWdhdGlvbiBMaW1pdGVkXG4vLyBBdXRob3I6IHRob210aG9tQHNrZXRjaHVwLmNvbSAoVGhvbWFzIFRob21hc3NlbilcblxuXG4vLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM4MjAzODEvbmVlZC1hLWJhc2VuYW1lLWZ1bmN0aW9uLWluLWphdmFzY3JpcHQjY29tbWVudDI5OTQyMzE5XzE1MjcwOTMxXG5leHBvcnQgZnVuY3Rpb24gYmFzZW5hbWUocGF0aDogc3RyaW5nKSB7XG4gICByZXR1cm4gcGF0aC5zcGxpdCgvW1xcXFwvXS8pLnBvcCgpO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBleHRuYW1lKHBhdGg6IHN0cmluZykge1xuICAgcmV0dXJuIHBhdGguc3BsaXQoL1suXS8pLnBvcCgpO1xufVxuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVHJpbWJsZSBOYXZpZ2F0aW9uIExpbWl0ZWRcclxuLy8gQXV0aG9yOiB0aG9tdGhvbUBza2V0Y2h1cC5jb20gKFRob21hcyBUaG9tYXNzZW4pXHJcblxyXG5pbXBvcnQgeyB1cGRhdGVUb2dnbGVCdXR0b25zIH0gZnJvbSBcIi4vdXRpbGl0aWVzXCI7XHJcblxyXG5cclxuLy8gSGFuZGxlcyB0aGUgdGFiIHRvZ2dsZSBmcm9tIHRoZSB0b3AgbmF2IGJhci4gU3dpdGNoIHRvIHRoZSBhcHByb3ByaWF0ZVxyXG4vLyBwYWdlIGFuZCBzZXQgdGhlIHdvcmtzcGFjZSBtb2RlLlxyXG5leHBvcnQgZnVuY3Rpb24gYWN0aXZhdGUoKSB7XHJcbiAgLy8gVG9nZ2xlcyB0aGUgYWN0aXZlIG5hdmlnYXRpb24gZWxlbWVudC5cclxuICB2YXIgJGxpbmsgPSAkKHRoaXMpO1xyXG4gICRsaW5rLmNsb3Nlc3QoJy5uYXYnKS5jaGlsZHJlbignbGknKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcbiAgJGxpbmsuY2xvc2VzdCgnbGknKS5hZGRDbGFzcygnYWN0aXZlJyk7XHJcbiAgLy8gVG9nZ2xlcyB0aGUgYWN0aXZlIHBhZ2UuXHJcbiAgdmFyIHBhZ2UgPSAkbGluay5kYXRhKCdwYWdlJyk7XHJcbiAgJCgnLnBhZ2UnKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcbiAgJCgnIycgKyBwYWdlKS5hZGRDbGFzcygnYWN0aXZlJyk7XHJcbiAgLy8gU2V0cyB0aGUgY3VycmVudCBwYWdlIG1vZGUuXHJcbiAgdmFyIG1vZGUgPSAkbGluay5kYXRhKCdwYWdlLW1vZGUnKTtcclxuICAkKFwiYm9keVwiKS5yZW1vdmVDbGFzcyAoZnVuY3Rpb24gKGluZGV4LCBjc3MpIHtcclxuICAgICAgcmV0dXJuIChjc3MubWF0Y2ggKC8oXnxcXHMpbW9kZS1cXFMrL2cpIHx8IFtdKS5qb2luKCcgJyk7XHJcbiAgfSk7XHJcbiAgJCgnYm9keScpLmFkZENsYXNzKG1vZGUpO1xyXG4gIC8vIE5lZWRlZCB0byBhY2NvdW50IGZvciBvZGQgZ2xpdGNoIHdoZXJlIHRoZSB0b2dnbGUgYnV0dG9ucyBkb2Vzbid0IHNpemVcclxuICAvLyBjb3JyZWN0bHkgdW5sZXNzIHRoZXkgYXJlIHZpc2libGUgd2hlbiB0aGlzIGlzIGRvbmUuXHJcbiAgdXBkYXRlVG9nZ2xlQnV0dG9ucygpO1xyXG59XHJcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRyaW1ibGUgTmF2aWdhdGlvbiBMdGQuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXHJcbi8vIEF1dGhvcjogdGhvbXRob21Ac2tldGNodXAuY29tIChUaG9tYXMgVGhvbWFzc2VuKVxyXG5cclxuLyogQSBjbGFzcyB0byBjb25zdHJ1Y3QgYSBwcm9tcHQgbWVzc2FnZSB0byB0aGUgdXNlci4gT2ZmZXJzIGNhbGxiYWNrcyBmb3JcclxuICogYWNjZXB0YW5jZSBhbmQgcmVqZWN0aW9uLlxyXG4gKlxyXG4gKiBsZXQgcHJvbXB0ID0gbmV3IFByb21wdERpYWxvZyh1aS5wcm9tcHQuaGVsbG8pXHJcbiAqIHByb21wdC5vbkFjY2VwdCA9IGZ1bmN0aW9uKCkge1xyXG4gKiAgIGFsZXJ0KCdIZWxsbyBXb3JsZCcpO1xyXG4gKiB9O1xyXG4gKiBwcm9tcHQuc2hvdygpO1xyXG4gKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBQcm9tcHREaWFsb2cge1xyXG5cclxuICBwdWJsaWMgb25BY2NlcHQ6IEZ1bmN0aW9uO1xyXG4gIHB1YmxpYyBvblJlamVjdDogRnVuY3Rpb247XHJcblxyXG4gIHByb3RlY3RlZCB0ZW1wbGF0ZTogRnVuY3Rpb247XHJcblxyXG4gIGNvbnN0cnVjdG9yKHRlbXBsYXRlOiBDbG9zdXJlVGVtcGxhdGUpIHtcclxuICAgIHRoaXMudGVtcGxhdGUgPSB0ZW1wbGF0ZTtcclxuICAgIC8vIFJlamVjdCB3aWxsIGJ5IGRlZmF1bHQgZG8gbm90aGluZy5cclxuICAgIHRoaXMub25SZWplY3QgPSBmdW5jdGlvbigpIHt9O1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHNob3coZGF0YT86IGFueSk6IHZvaWQge1xyXG4gICAgLy8gQ2xlYW4gdXAgYW55IHByZXZpb3VzIHByb21wdHMuXHJcbiAgICB0aGlzLmVsZW1lbnQoKS5kZXRhY2goKTtcclxuICAgIC8vIENyZWF0ZSB0aGUgSFRNTCBlbGVtZW50cy5cclxuICAgIGxldCBkaWFsb2cgPSBzb3kucmVuZGVyQXNGcmFnbWVudCh0aGlzLnRlbXBsYXRlLCBkYXRhKTtcclxuICAgIGxldCAkZGlhbG9nID0gJChkaWFsb2cpO1xyXG4gICAgLy8gSG9vayB1cCBldmVudHMuXHJcbiAgICAkZGlhbG9nLmZpbmQoJy5idG4tYWNjZXB0Jykub24oJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICB0aGlzLm9uQWNjZXB0KCk7XHJcbiAgICB9KTtcclxuICAgICRkaWFsb2cuZmluZCgnLmJ0bi1yZWplY3QnKS5vbignY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgIHRoaXMub25SZWplY3QoKTtcclxuICAgIH0pO1xyXG4gICAgLy8gRGlzcGxheSB0aGUgcHJvbXB0LlxyXG4gICAgJCgnYm9keScpLmFwcGVuZCgkZGlhbG9nKTtcclxuICAgICRkaWFsb2cubW9kYWwoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBlbGVtZW50KCkge1xyXG4gICAgcmV0dXJuICQoJy51aS1wcm9tcHQnKTtcclxuICB9XHJcblxyXG59XHJcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRyaW1ibGUgTmF2aWdhdGlvbiBMaW1pdGVkXHJcbi8vIEF1dGhvcjogdGhvbXRob21Ac2tldGNodXAuY29tIChUaG9tYXMgVGhvbWFzc2VuKVxyXG5cclxuaW1wb3J0IHsgQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XHJcbmltcG9ydCAqIGFzIFNrZXRjaFVwIGZyb20gXCIuL3NrZXRjaHVwXCI7XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgbGV0ICRjb25maXJtQnV0dG9uID0gJChcIiNtb2RhbC1zZXR0aW5ncyAuYnRuLWNvbmZpcm1cIik7XHJcbiAgJGNvbmZpcm1CdXR0b24ub24oXCJjbGlja1wiLCBvbkNvbmZpcm0pO1xyXG5cclxuICAvLyBBZGQgYSBjbGFzcyB0byB0aGUgcGFyZW50IGxpc3QgZWxlbWVudCB0aGF0IHJlZmxlY3QgdGhlIGNoZWNrYm94IHN0YXRlLlxyXG4gICQoZG9jdW1lbnQpLm9uKCdjaGFuZ2UnLCAnI21vZGFsLXNldHRpbmdzIC5zdS1vcHRpb24tbGlzdCBpbnB1dCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgbGV0ICRyYWRpb2JveCA9ICQodGhpcyk7XHJcbiAgICBsZXQgJGxpID0gJHJhZGlvYm94LmNsb3Nlc3QoJ2xpJyk7XHJcbiAgICAkKCcjbW9kYWwtc2V0dGluZ3MgLnN1LW9wdGlvbi1saXN0IGxpJykucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkJyk7XHJcbiAgICBpZiAoJHJhZGlvYm94LmlzKCc6Y2hlY2tlZCcpKSB7XHJcbiAgICAgICRsaS5hZGRDbGFzcygnc2VsZWN0ZWQnKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZShjb25maWc6IENvbmZpZykge1xyXG4gIGxldCBtb2RlID0gY29uZmlnLnNlY3VyaXR5X3BvbGljeTtcclxuICBsZXQgJG9wdGlvbiA9ICQoYGlucHV0OnJhZGlvW25hbWU9J29wdGlvbi1zZWN1cml0eS1tb2RlJ11bdmFsdWU9JHttb2RlfV1gKTtcclxuICAkb3B0aW9uLnByb3AoXCJjaGVja2VkXCIsIHRydWUpLmNoYW5nZSgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBvbkNvbmZpcm0oKSB7XHJcbiAgbGV0ICRjaGVja2VkT3B0aW9uID0gJChcImlucHV0OnJhZGlvW25hbWU9J29wdGlvbi1zZWN1cml0eS1tb2RlJ106Y2hlY2tlZFwiKTtcclxuICBsZXQgc2V0dGluZ3NTZWN1cml0eSA9ICRjaGVja2VkT3B0aW9uLnZhbCgpO1xyXG4gIFNrZXRjaFVwLnNldFNlY3VyaXR5UG9saWN5KHNldHRpbmdzU2VjdXJpdHkpO1xyXG59XHJcbiIsImltcG9ydCB7IFByb21wdERpYWxvZyB9IGZyb20gXCIuL3Byb21wdFwiO1xyXG5pbXBvcnQgKiBhcyBTa2V0Y2hVcCBmcm9tIFwiLi9za2V0Y2h1cFwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNob3dEaWFsb2coKSB7XHJcbiAgbGV0ICRkaWFsb2cgPSBnZXREaWFsb2coKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0RGlhbG9nKCkge1xyXG4gIC8vIFRoZXJlIG1pZ2h0IGJlIGEgbGVmdG92ZXIgZnJvbSBhIHByZXZpb3VzIGRpYWxvZyBpbiB0aGUgRE9NIHRyZWUuIFNvIHdlXHJcbiAgLy8gbXVzdCBjaGVjayBpZiBpdCdzIHZpc2libGUgdG8gY2hlY2sgaWYgaXQgaXMgc3RpbGwgYWN0aXZlLlxyXG4gIGxldCAkZGlhbG9nID0gJCgnLnVpLXByb21wdCcpO1xyXG4gIC8vIFRoaXMgaXMgc29tZXdoYXQgb2YgYSBoYWNrIC0gYXQgbGVhc3Qgbm90IHByZXR0eS4gTm9ybWFsbHkgb25lIGNhbiB1c2VcclxuICAvLyAkZGlhbG9nLmlzKCc6dmlzaWJsZScpIHdoaWNoIHJlYWRzIGJldHRlciAtIGJ1dCBub3QgcmlnaHQgYWZ0ZXIgdGhlXHJcbiAgLy8gZGlhbG9nIGlzIGNyZWF0ZWQgYW5kIHNob3duIC0gdGhlbiBpdCB3b3VsZCBzdGlsbCByZXR1cm4gZmFsc2UuXHJcbiAgLy8gU2FtZSB0aGluZyBmb3IgJGRpYWxvZy5oYXNDbGFzcygnaW4nKTsuXHJcbiAgLy8gU28gaW5zdGVhZCB3ZSBjaGVjayBmb3IgdGhlIG92ZXJsYXkgYmFja2Ryb3AgZWxlbWVudCBCb290c3RyYXAgY3JlYXRlcy5cclxuICBsZXQgdmlzaWJsZSA9ICQoJy5tb2RhbC1iYWNrZHJvcCcpLmxlbmd0aCA+IDA7XHJcbiAgLy8gQ3JlYXRlIHRoZSBkaWFsb2cgaWYgaXQgaXNuJ3QgYWxyZWFkeSB2aXNpYmxlLlxyXG4gIGlmICgkZGlhbG9nLmxlbmd0aCA9PT0gMCB8fCAhdmlzaWJsZSkge1xyXG4gICAgbGV0IHByb21wdCA9IG5ldyBQcm9tcHREaWFsb2codWkucHJvbXB0LnNpZ25PdXQpXHJcbiAgICBwcm9tcHQub25BY2NlcHQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgLy8gRG9uJ3QgbmVlZCB0byBkbyBhbnl0aGluZyAtIGJ1dCB0aGUgUHJvbXB0RGlhbG9nIG5lZWQgYSBmdW5jdGlvbi5cclxuICAgICAgU2tldGNoVXAuc2lnbkluT3JPdXQoZmFsc2UpO1xyXG4gICAgfTtcclxuICAgIHByb21wdC5zaG93KCk7XHJcbiAgICAkZGlhbG9nID0gcHJvbXB0LmVsZW1lbnQoKTtcclxuICB9XHJcbiAgcmV0dXJuICRkaWFsb2c7XHJcbn1cclxuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVHJpbWJsZSBOYXZpZ2F0aW9uIEx0ZC4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vIEF1dGhvcjogdGhvbXRob21Ac2tldGNodXAuY29tIChUaG9tYXMgVGhvbWFzc2VuKVxuXG5pbXBvcnQgKiBhcyBCcmlkZ2UgZnJvbSBcIi4vYnJpZGdlXCI7XG5pbXBvcnQgeyBDb21wbGlhbmNlTW9kZSB9IGZyb20gXCIuL2VudW1zXCI7XG5cblxuZXhwb3J0IGludGVyZmFjZSBFeHRlbnNpb25Kc29uIHtcbiAgbG9jYWxfaWQ6IHN0cmluZztcbiAgZW5hYmxlZDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFeHRlbnNpb25Kc29uRGF0YSB7XG4gIGV4dGVuc2lvbnM6IEV4dGVuc2lvbkpzb25bXTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gc2V0RXh0ZW5zaW9uc0VuYWJsZWQoZXh0ZW5zaW9uczogRXh0ZW5zaW9uSnNvbkRhdGEpIHtcbiAgLy8gV2UgY2Fubm90IHNlbmQgYXJyYXlzLCBvciBzaW1wbGUgb2JqZWN0cywgc28gd2UgdXNlIEpTT04gc3RyaW5ncyBpbnN0ZWFkLlxuICBsZXQganNvbiA9IEpTT04uc3RyaW5naWZ5KGV4dGVuc2lvbnMpO1xuICBCcmlkZ2UuY2FsbCgnU2V0RXh0ZW5zaW9uc0VuYWJsZWQnLCBqc29uKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluc3RhbGxFeHRlbnNpb25Gcm9tRmlsZSgpIHtcbiAgQnJpZGdlLmNhbGwoJ0luc3RhbGxFeHRlbnNpb25Gcm9tRmlsZScpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5pbnN0YWxsRXh0ZW5zaW9ucyhpZHM6IHN0cmluZ1tdKSB7XG4gIEJyaWRnZS5jYWxsKCdVbmluc3RhbGxFeHRlbnNpb25zJywgLi4uaWRzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUV4dGVuc2lvbnMoaWRzOiBzdHJpbmdbXSkge1xuICBCcmlkZ2UuY2FsbCgnVXBkYXRlRXh0ZW5zaW9ucycsIC4uLmlkcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cnVzdEV4dGVuc2lvbihpZDogc3RyaW5nKSB7XG4gIEJyaWRnZS5jYWxsKCdUcnVzdEV4dGVuc2lvbicsIGlkKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUxpY2Vuc2UoaWQ6IHN0cmluZykge1xuICBCcmlkZ2UuY2FsbCgnVXBkYXRlTGljZW5zZScsIGlkKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFNlY3VyaXR5UG9saWN5KG1vZGU6IENvbXBsaWFuY2VNb2RlKSB7XG4gIEJyaWRnZS5jYWxsKCdTZXRTZWN1cml0eVBvbGljeScsIG1vZGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd2luZG93UmVhZHkoKSB7XG4gIEJyaWRnZS5jYWxsKCdXaW5kb3dSZWFkeScpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2lnbkluT3JPdXQoc2lnbl9pbjogYm9vbGVhbikge1xuICBCcmlkZ2UuY2FsbCgnU2lnbkluT3JPdXQnLCBzaWduX2luKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9wZW5VcmwodXJsOiBzdHJpbmcpIHtcbiAgQnJpZGdlLmNhbGwoJ09wZW5VcmwnLCB1cmwpO1xufVxuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVHJpbWJsZSBOYXZpZ2F0aW9uIExpbWl0ZWRcbi8vIEF1dGhvcjogdGhvbXRob21Ac2tldGNodXAuY29tIChUaG9tYXMgVGhvbWFzc2VuKVxuXG5pbXBvcnQgeyBDb21wbGlhbmNlTW9kZSB9IGZyb20gXCIuL2VudW1zXCI7XG5pbXBvcnQgeyBVc2VyIH0gZnJvbSBcIi4vdXNlclwiO1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0KCkge1xuICAvLyBUbyBwcmV2ZW50IGhhcmQgY29kaW5nIHRoZSB2YWx1ZXMgZm9yIHRoZSBzZWN1cml0eSBvcHRpb25zIGFuZCByaXNrIGdldHRpbmdcbiAgLy8gdGhlbSBvdXQgb2Ygc3luYyB3ZSBwYXNzIHRoZXNlIHZhbHVlcyB0byB0aGUgdGVtcGxhdGUgd2hlbiBpdHMgaW5pdGlhbGl6ZWQuXG4gIGxldCBjb25maWcgPSB7XG4gICAgc2V0dGluZ3M6IHtcbiAgICAgIHNlY3VyaXR5OiB7XG4gICAgICAgIG1vZGVfc2lnbmVkX29ubHk6IENvbXBsaWFuY2VNb2RlLmtDZXJ0aWZpZWQsXG4gICAgICAgIG1vZGVfYXBwcm92ZTogICAgIENvbXBsaWFuY2VNb2RlLmtQcm9tcHQsXG4gICAgICAgIG1vZGVfb2ZmOiAgICAgICAgIENvbXBsaWFuY2VNb2RlLmtDb21wYXRpYmlsaXR5XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBzb3kucmVuZGVyRWxlbWVudChkb2N1bWVudC5ib2R5LCB1aS5kaWFsb2cuaHRtbCwgY29uZmlnKTtcbiAgLy8gQm9vdHN0cmFwIHdpbGwgc2V0IHRoZSB0YWIgZm9jdXMgdG8gdGhlIGVsZW1lbnQgdGhhdCB0cmlnZ2VyZWQgdGhlIGVsZW1lbnRcbiAgLy8gYWZ0ZXIgaXQgY2xvc2VzLiBUaGlzIHlpZWxkcyBhbiB1bmRlc2lyZWQgYmx1ZSBmb2N1cyByZWN0YW5nbGUuIFdlIHN0aWxsXG4gIC8vIHdhbnQgdG8gYWxsb3cgdGhlIHVzZXIgdG8gdGFiIHRocm91Z2ggdGhlIFVJIGVsZW1lbnRzIHNvIHdlIGNhbid0IHNpbXBseVxuICAvLyByZW1vdmUgdGhlIG91dGxpbmUuIFNvIHdlIHRhcCBpbnRvIHRoZSBldmVudCB3aGVuIHRoZSBtb2RhbCBjbG9zZXMgYW5kXG4gIC8vIG1ha2Ugc3VyZSB0byByZW1vdmUgZm9jdXMgZnJvbSB0aGUgZWxlbWVudC5cbiAgJChkb2N1bWVudCkub24oJ2hpZGRlbi5icy5tb2RhbCcsICcjbW9kYWwtc2V0dGluZ3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgJCgnLnNldHRpbmdzLWljb24gYScpLmJsdXIoKTtcbiAgfSlcblxuICBkaXNhYmxlX3NlbGVjdCgpO1xuICBkaXNhYmxlX2NvbnRleHRfbWVudSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlVXNlckluZm8odXNlcjogVXNlcikge1xuICBsZXQgdXNlckluZm8gPSAkKCcudXNlci1pbmZvJykuZ2V0KDApO1xuICBzb3kucmVuZGVyRWxlbWVudCh1c2VySW5mbywgdWkubmF2YmFyLnVzZXIsIHVzZXIpO1xufVxuXG4vKiBEaXNhYmxlcyB0ZXh0IHNlbGVjdGlvbiBvbiBlbGVtZW50cyBvdGhlciB0aGFuIGlucHV0IHR5cGUgZWxlbWVudHMgd2hlcmVcbiAqIGl0IG1ha2VzIHNlbnNlIHRvIGFsbG93IHNlbGVjdGlvbnMuIFRoaXMgbWltaWNzIG5hdGl2ZSB3aW5kb3dzLlxuICovXG5mdW5jdGlvbiBkaXNhYmxlX3NlbGVjdCgpIHtcbiAgJChkb2N1bWVudCkub24oJ21vdXNlZG93biBzZWxlY3RzdGFydCcsIGZ1bmN0aW9uKGU6IEpRdWVyeUV2ZW50T2JqZWN0KSB7XG4gICAgcmV0dXJuICQoZS50YXJnZXQpLmlzKCdpbnB1dCwgdGV4dGFyZWEsIHNlbGVjdCwgb3B0aW9uJyk7XG4gIH0pO1xufVxuXG5cbi8qIERpc2FibGVzIHRoZSBjb250ZXh0IG1lbnUgd2l0aCB0aGUgZXhjZXB0aW9uIGZvciB0ZXh0Ym94ZXMgaW4gb3JkZXIgdG9cbiAqIG1pbWljIG5hdGl2ZSB3aW5kb3dzLlxuICovXG5mdW5jdGlvbiBkaXNhYmxlX2NvbnRleHRfbWVudSgpIHtcbiAgJChkb2N1bWVudCkub24oJ2NvbnRleHRtZW51JywgZnVuY3Rpb24oZTogSlF1ZXJ5RXZlbnRPYmplY3QpIHtcbiAgICAvLyBBbGxvdyBDdHJsICsgU2hpZnQgdG8gZW5hYmxlIHRoZSBuYXRpdmUgY29udGV4dCBtZW51IGFzIGEgYmFja2Rvb3IgZm9yXG4gICAgLy8gZGVidWdnaW5nLlxuICAgIGlmIChlLmN0cmxLZXkgJiYgZS5zaGlmdEtleSlcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIC8vIE90aGVyd2lzZSBkaXNhYmxlIGl0IGZvciBub24taW5wdXQgZWxlbWVudHMuXG4gICAgcmV0dXJuICQoZS50YXJnZXQpLmlzKCdpbnB1dFt0eXBlPXRleHRdLCBpbnB1dFt0eXBlPWVtYWlsXSwgaW5wdXRbdHlwZT1wYXNzd29yZF0sIHRleHRhcmVhJyk7XG4gIH0pO1xufVxuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVHJpbWJsZSBOYXZpZ2F0aW9uIExpbWl0ZWRcbi8vIEF1dGhvcjogdGhvbXRob21Ac2tldGNodXAuY29tIChUaG9tYXMgVGhvbWFzc2VuKVxuXG5cbi8vIGh0dHBzOi8vcmVteXNoYXJwLmNvbS8yMDEwLzA3LzIxL3Rocm90dGxpbmctZnVuY3Rpb24tY2FsbHNcbmV4cG9ydCBmdW5jdGlvbiBkZWJvdW5jZShmbjogRnVuY3Rpb24sIGRlbGF5OiBudW1iZXIpIHtcbiAgbGV0IHRpbWVyOiBudW1iZXIgPSBudWxsO1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIGxldCBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICBmbi5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICB9LCBkZWxheSk7XG4gIH07XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbUZyb21SYW5nZShtaW46IG51bWJlciwgbWF4OiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KSArIG1pblxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVUb2dnbGVCdXR0b25zKCkge1xuICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8zMjU4ODMxMi80ODY5OTBcbiAgLy8gbm93IHRoYXQgd2UgaGF2ZSBkeW5hbWljYWxseSBsb2FkZWQgZWxlbWVudHNcbiAgLy8gd2UgbmVlZCB0byBpbml0aWFsaXplIGFueSB0b2dnbGVzIHRoYXQgd2VyZSBhZGRlZFxuICAvLyB5b3Ugc2hvdWxkbid0IHJlLWluaXRpYWxpemUgYW55IHRvZ2dsZXMgYWxyZWFkeSBwcmVzZW50XG4gIC8vIGJ1dCB3ZSBhbHNvIGRvIHdhbnQgdG8gaGF2ZSB0byBmaWd1cmUgb3V0IGhvdyB0byBmaW5kIHRoZSBvbmVzIHdlIGFkZGVkXG4gIC8vIGluc3RlYWQsIHdlJ2xsIGRlc3Ryb3kgYWxsIHRvZ2dsZXMgYW5kIHJlY3JlYXRlIGFsbCBuZXcgb25lc1xuICAkKFwiW2RhdGEtdG9nZ2xlPSd0b2dnbGUnXVwiKS5ib290c3RyYXBUb2dnbGUoJ2Rlc3Ryb3knKVxuICAkKFwiW2RhdGEtdG9nZ2xlPSd0b2dnbGUnXVwiKS5ib290c3RyYXBUb2dnbGUoKTtcbn1cbiJdfQ==
