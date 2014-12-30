(function ( $ ) {
	$.fn.user_validation = function(options) {
		$(options).validate({
			errorClass: "has-error",
			rules: {
				frm_users_name: {
					minlength: 5,
					required: true
				},
				frm_email1: {
					required: true,
					email: true
				},
				frm_email2: {
					required: true,
					email: true,
					equalTo: "#frm_email1"
				},
				frm_password: {
					required: true,
					minlength: 6
				},
				frm_password_confirm: {
					required: true,
					minlength: 6,
					equalTo: "#frm_password"
				}
			},
			messages: {
				frm_users_name: {
					required: "Please enter your name",
					minlength: "Your must be at least 5 characters"
				},
				frm_email1: {
					required: "Please provide a valid email address",
					minlength: "Your email must be at least 5 characters long"
				},
				frm_email2: {
					required: "Please provide a valid email address",
					minlength: "Your email must be at least 5 characters long",
					equalTo: "Please enter the same email as above"
				},
				frm_password: {
					required: "Please provide an password",
					minlength: "Your password must be at least 6 characters long"
				},
				frm_password_confirm: {
					required: "Please provide an password",
					minlength: "Your password must be at least 6 characters long",
					equalTo: "Please enter the same password as above"
				}
			}
		});
	};
}( jQuery ));