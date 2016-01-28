/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var _ = require("sdk/l10n").get;
var preferences = require("sdk/simple-prefs");
var prefService = require("sdk/preferences/service");
var prefs = preferences.prefs;
var tabUtils = require("sdk/tabs/utils");
var lists = require("./lists");
var URL = require("sdk/url").URL;

exports.notify = function(window, callingStackMsg){
	"use strict";
	
	var contentURL = new URL(window.location);
	if (prefs.showNotifications && !lists.get("ignore").match(contentURL)){
		var url = contentURL.href;
		var domain = contentURL.hostname;
		var message = _("fakedReadout").replace(/\{url\}/g, domain);
		
		var tab = tabUtils.getTabForContentWindow(window);
		var tabBrowser = tabUtils.getTabBrowserForTab(tab);
		var browser = tabUtils.getBrowserForTab(tab);
		
		var notifyBox = tabBrowser.getNotificationBox(browser);
		var notification = notifyBox.getNotificationWithValue("fake-readout");
		if (notification){
			notification.label = message;
			notification.url = url;
			notification.domain = domain;
			notification.callingStackMsg = callingStackMsg;
		}
		else {
			var buttons = [
				{
					label: _("displayFullURL"),
					accessKey: "",
					callback: function(){
						browser.contentWindow.alert(notification.url);
						// only way to prevent closing... see https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XUL/Method/appendNotification#Notification_box_events
						throw new Error("Do not close notification.");
					}
				},
				{
					label: _("displayCallingStack"),
					accessKey: "",
					callback: function(){
						browser.contentWindow.alert(notification.callingStackMsg);
						// only way to prevent closing... see https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XUL/Method/appendNotification#Notification_box_events
						throw new Error("Do not close notification.");
					}
				},
				{
					label: _("ignorelistDomain"),
					accessKey: "",
					callback: function(){
						var domain = browser.contentWindow.prompt(
							_("inputIgnoreDomain"),
							notification.domain
						);
						if (domain){
							lists.appendTo("ignore", domain);
						}
					}
				},
				{
					label: _("whitelistURL"),
					accessKey: "",
					callback: function(){
						var url = browser.contentWindow.prompt(
							_("inputWhitelistDomain"),
							"^" + notification.url.replace(/([\\\+\*\?\[\^\]\$\(\)\{\}\=\!\|\.])/g, "\\$1") + "$"
						);
						if (url){
							lists.appendTo("white", url);
						}
					}
				},
				{
					label: _("whitelistDomain"),
					accessKey: "",
					callback: function(){
						var domain = browser.contentWindow.prompt(
							_("inputWhitelistURL"),
							notification.domain
						);
						if (domain){
							lists.appendTo("white", domain);
						}
						
					}
				},
				{
					label: _("disableNotifications"),
					accessKey: "",
					callback: function(){
						prefs.showNotifications = false;
						prefService.set("extensions.CanvasBlocker@kkapsner.de.showNotifications", prefs.showNotifications);
					}
				}
			];

			var priority = notifyBox.PRIORITY_WARNING_MEDIUM;
			notification = notifyBox.appendNotification(
				message,
				"fake-readout",
				"chrome://browser/skin/Info.png",
				priority,
				buttons
			);
			notification.url = url;
			notification.domain = domain;
			notification.callingStackMsg = callingStackMsg;
		}
	}
};