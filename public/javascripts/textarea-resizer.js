//=======================================================================
// Copyright Mark Moffat (mrvautin) 2014.
// Distributed under the Apache v2 License.
// Mark Moffat - http://markmoffat.com
//=======================================================================
(function ( $ ) {
	$.fn.resizer = function(options) {
		var $textarea = this;
		var $window = $(window).on('resize', function(){
			
			if($($textarea).attr('id') == "body_row"){
				$textarea.css("height", calc_height(options) - options.negative_padding);
			}else{
				$textarea.height(calc_height(options) - options.negative_padding);
			}			
		}).trigger('resize'); //on page load
		
		return this;
	};
}( jQuery ));

function calc_height(options){
	var settings = $.extend({
			// These are the defaults.
			offset_elements: ["#header","#footer"],
			negative_padding: 15
		}, options );
		
	var total_offset_height = 0;// - settings.negative_padding;

	// get total height of elements supplied
	for (var i in settings.offset_elements) {
		total_offset_height = parseFloat(total_offset_height) + parseFloat($(settings.offset_elements[i]).outerHeight());
	}
	var gross_height = $(window).outerHeight();
	return parseFloat(gross_height) - parseFloat(total_offset_height);
}