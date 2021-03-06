/**
 * @fileOverview Auth scene assistant
 * @author <a href="http://decafbad.com">l.m.orchard@pobox.com</a>
 * @version 0.1
 */
/*jslint laxbreak: true */
/*global Decafbad, AppGlobals, FlickrUploadr, Mojo, $, $L, $A, $H, SimpleDateFormat */
function AuthAssistant() {
}

AuthAssistant.prototype = (function () { /** @lends AuthAssistant# */

    return {

        /**
         * Setup the application.
         */
        setup: function () {
            this.controller.setupWidget(
                'auth-button', { 'label': 'Authenticate' }, { }
            );
            this.controller.setupWidget(
                'continue-button', { 'label': 'Continue' }, { }
            );
        },

        /**
         * React to card activation.
         */
        activate: function (ev) {
            Decafbad.Utils.setupListeners([
                ['auth-button', Mojo.Event.tap, this.handleAuthTap],
                ['continue-button', Mojo.Event.tap, this.handleContinueTap]
            ], this);

            // Since this scene may be pushed by a reauth request, clear the
            // credentials if any exist.
            AppGlobals.frob = null;
            var token_cookie  = new Mojo.Model.Cookie('flickr_token');
            token_cookie.put(AppGlobals.api.options.token = null);
            var user_cookie  = new Mojo.Model.Cookie('flickr_user');
            user_cookie.put(AppGlobals.api.options.user = null);
        },

        /**
         * React for card deactivation.
         */
        deactivate: function (ev) {
            Decafbad.Utils.clearListeners(this);
        },

        /**
         * Handle ultimate card clean up.
         */
        cleanup: function (ev) {
        },

        /**
         * Handle a tap on the auth button to initiate Flickr auth process.
         */
        handleAuthTap: function (ev) {
            Decafbad.Utils.setupLoadingSpinner(this);
            AppGlobals.api.auth_getFrob(
                {}, 
                function (frob, grant_url) {
                    Decafbad.Utils.hideLoadingSpinner(this);
                    AppGlobals.frob = frob;
                    Mojo.log("AUTH URL %s %j", frob, grant_url);

                    this.controller.serviceRequest(
                        "palm://com.palm.applicationManager", 
                        {
                            method: "open",
                            parameters:  {
                                id: 'com.palm.app.browser',
                                params: { target: grant_url }
                            }
                        }
                    );

                }.bind(this),
                function (ev) {
                    Mojo.log("AUTH GETFROB FAILED %j", (ev.responseText));
                    this.controller.showAlertDialog({
                        onChoose: function(value) {},
                        title: $L("Authentication Failed"),
                        message:
                            $L("A call to the Flickr API failed.  " + 
                            "Please try authenticating again."),
                        choices: [
                            {label:$L("OK"), value:""}
                        ]
                    });
                }.bind(this)
            );
        },

        /**
         * Handle a tap on the continue button to complete Flickr auth process.
         */
        handleContinueTap: function (ev) {
            AppGlobals.api.auth_getToken(
                { frob: AppGlobals.frob },
                
                function (token, user) {
                    var token_cookie  = new Mojo.Model.Cookie('flickr_token');
                    token_cookie.put(AppGlobals.api.options.token = token);
                    var user_cookie  = new Mojo.Model.Cookie('flickr_user');
                    user_cookie.put(AppGlobals.api.options.user = user);
                    Mojo.log('getToken: %s', token);
                    Mojo.log('auth user: %j', user);
                    this.controller.stageController.popScene({ authenticated: true });
                }.bind(this),
                
                function (ev) {
                    Mojo.log("AUTH GETTOKEN FAILED %j", (ev.responseText));
                    this.controller.showAlertDialog({
                        onChoose: function(value) {},
                        title: $L("Authentication Failed"),
                        message:
                            $L("Access was not approved. " + 
                            "Please try authenticating again. " + 
                            "It may help to refresh the Flickr page " +
                            "in the browser once before authorizing, " +
                            "due to caching issues."),
                        choices: [
                            {label:$L("OK"), value:""}
                        ]
                    });
                }.bind(this)
            );
        },

        EOF:null
    };
}());
