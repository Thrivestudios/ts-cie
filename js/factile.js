(function($){
	
	$.fn.factile = function(options){
	
		var settings = $.extend({
			view: 		true,
			fav: 		true,
			share: 		true,
			add: 		true,
			complete:	null
		}, options);
		
		return this.each(function(){
			var actionBar = $('<div />').addClass('factile-actions');
			
			if(settings.view) actionBar.append('<a href="#" class="btn no-text"><span class="icon icon-view"></span>View</a>');
			if(settings.fav) actionBar.append('<a href="#" class="btn no-text"><span class="icon icon-fav"></span>Favorite</a>');
			if(settings.share) actionBar.append('<a href="#" class="btn no-text"><span class="icon icon-share"></span>Share</a>');
			if(settings.add) actionBar.append('<a href="#" class="btn no-text"><span class="icon icon-add"></span>Add</a>');

			$(this).append(actionBar);
			$(this).hover(
				function(){
					$(this).children('.factile-actions').slideDown('fast');
				},
				function(){
					$(this).children('.factile-actions').slideUp('fast');
				}
			)
			
			if($.isFunction(settings.complete)){
				settings.complete.call(this);
			}
		});
	
	};
	
}( jQuery ));