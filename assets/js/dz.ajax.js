/**

	Abstract : Ajax Page Js File
	File : dz.ajax.js
	#CSS attributes: 
		.dzForm : Form class for ajax submission. 
		.dzFormMsg  : Div Class| Show Form validation error/success message on ajax form submission
		
	#Javascript Variable
	.dzRes : ajax request result variable
	.dzFormAction : Form action variable
	.dzFormData : Form serialize data variable

**/

// ==============================================================================
// GOOGLE SHEETS WEBHOOK INTEGRATION
// Target Sheet: https://docs.google.com/spreadsheets/d/1svK_6Fbfx5W1ngfVgTw52SCgqUIONuYUMHEzGHwXHNQ/edit
// ==============================================================================
var GOOGLE_SHEET_WEB_APP_URL = window.GOOGLE_SHEET_WEB_APP_URL || "https://script.google.com/macros/s/AKfycbyb194q_krishna_hospital/exec";

function contactForm() {
    window.verifyRecaptchaCallback = function(response) {
        $('input[data-recaptcha]').val(response).trigger('change');
    }

    window.expiredRecaptchaCallback = function() {
        $('input[data-recaptcha]').val("").trigger('change');
    }
    'use strict';

    var msgDiv;

    $(".dzForm").on('submit', function(e) {
        e.preventDefault(); // STOP default page reload
        var thisForm = $(this);

        // Native HTML5 validation check
        if (this.checkValidity && !this.checkValidity()) {
            this.reportValidity();
            return;
        }

        var formMsgDiv = thisForm.find('.dzFormMsg');
        if (formMsgDiv.length === 0) {
            formMsgDiv = $('.dzFormMsg');
        }

        var submitBtn = thisForm.find('button[type="submit"]');
        var originalBtnHtml = submitBtn.html();

        // Show loading state on button and message
        submitBtn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Submitting...');
        formMsgDiv.html('<div class="alert alert-info py-2 px-3 small border-0"><i class="feather icon-loader me-1"></i> Saving your request...</div>').show();

        // Determine destination: Google Apps Script Web App
        var targetUrl = (typeof GOOGLE_SHEET_WEB_APP_URL !== 'undefined' && GOOGLE_SHEET_WEB_APP_URL && !GOOGLE_SHEET_WEB_APP_URL.includes('_placeholder')) 
            ? GOOGLE_SHEET_WEB_APP_URL 
            : (window.GOOGLE_SHEET_URL || $(this).attr('action'));

        // Serialize all form inputs into FormData
        var formData = new FormData(thisForm[0]);

        // Submit via fetch with mode 'no-cors' for Google Apps Script Web App redirection compatibility
        fetch(targetUrl, {
            method: "POST",
            mode: "no-cors",
            body: formData
        })
        .then(function() {
            submitBtn.prop('disabled', false).html(originalBtnHtml);
            formMsgDiv.html(
                '<div class="alert alert-success py-3 px-4 rounded-3 shadow-sm border-0">' +
                '<i class="feather icon-check-circle me-2 fs-5 text-success"></i>' +
                '<strong>Thank you!</strong> Your request has been successfully submitted and saved. Our hospital OPD desk will contact you shortly.' +
                '</div>'
            ).show();

            thisForm[0].reset();

            // If appointment page, reset timing badge
            var timingBadge = document.getElementById('doctorTimingInfo');
            if (timingBadge) {
                timingBadge.style.display = 'none';
            }

            setTimeout(function() {
                formMsgDiv.fadeOut(600);
            }, 8000);
        })
        .catch(function(err) {
            submitBtn.prop('disabled', false).html(originalBtnHtml);
            formMsgDiv.html(
                '<div class="alert alert-danger py-2 px-3 rounded-3 shadow-sm border-0">' +
                '<i class="feather icon-alert-circle me-2 text-danger"></i>' +
                'Unable to submit at this moment. Please call us directly at <strong>08172 - 462618</strong>.' +
                '</div>'
            ).show();
        });
    });


    /* This function is for mail champ subscription START*/
    $(document).on('submit', ".dzSubscribe", function(e) {
        e.preventDefault(); //STOP default action
        var thisForm = $(this);
        var dzFormAction = thisForm.attr('action');
        var dzFormData = thisForm.serialize();
        thisForm.addClass('dz-ajax-overlay');

        $.ajax({
            method: "POST",
            url: dzFormAction,
            data: dzFormData,
            dataType: 'json',
            success: function(dzRes) {
                thisForm.removeClass('dz-ajax-overlay');

                if (dzRes.status == 1) {
                    msgDiv = '<div class="gen alert dz-alert alert-success">' + dzRes.msg + '</div>';
                }
                if (dzRes.status == 0) {
                    msgDiv = '<div class="err alert dz-alert alert-danger">' + dzRes.msg + '</div>';
                }

                $('.dzSubscribeMsg').html(msgDiv);
                setTimeout(function() {
                    $('.dzSubscribeMsg .alert').hide(0);
                }, 5000);

                $('.dzSubscribe')[0].reset();
            }
        })
    });

    /* This function is for mail champ subscription END*/

    /* ajax load more Start*/
    $(".dz-load-more").on('click', function(e) {
        e.preventDefault(); //STOP default action
        var dzLoadMoreUrl = $(this).attr('rel');

        $.ajax({
            method: "POST",
            url: dzLoadMoreUrl,
            dataType: 'html',
            success: function(data) {
                $(".loadmore-content").append(data);
            }
        })
    });
    /* ajaz load more END*/
}

jQuery(document).ready(function() {
    'use strict';
    contactForm();
})
