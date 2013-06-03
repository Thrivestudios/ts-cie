(function($){
	
	$.fn.factile = function(options){
	
		var settings = $.extend({
			mini:		false,
			dragdrop:	false,
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
			
			// add expand/collapse capability
			if(settings.mini){
				var expandIcon = $('<div />').addClass('mini-expand').html('<span class="icon icon-expand"></span>');
				
				expandIcon.click(function(){
					var that = $(this).parent();
					console.log(that);
					if(that.hasClass('mini')){
						that.draggable('disable');
						that.find('.factile-header h1').fadeOut(100, function(){
							that.animate({
								height: 266,
								width:195,
								margin:0,
								paddingRight:6
							}, 100,	function(){
								that.find('.factile-full').fadeIn(100, function(){
									that.removeClass('mini');
									that.find('.factile-header h1').fadeIn();
								});
							});
						});
						that.find('.icon-expand').removeClass('icon-expand').addClass('icon-collapse');
					} else {
						that.draggable( "enable" );
						that.find('.factile-header h1').fadeOut(100, function(){
							that.find('.factile-full').fadeOut(100, function(){
								that.animate({
									height: 65,
									width:74,
									margin:4,
									paddingRight:0
								}, 100,	function(){
									that.addClass('mini');
									that.find('.factile-header h1').fadeIn();
								});
							});
						});
						that.find('.icon-collapse').removeClass('icon-collapse').addClass('icon-expand');
					}
				});
				
				$(this).append(expandIcon);
			} else {
				$(this).hover(
					function(){
						$(this).children('.factile-actions').slideDown('fast');
					},
					function(){
						$(this).children('.factile-actions').slideUp('fast');
					}
				)
			}
			
			if(settings.dragdrop){
				$(this).draggable({
					appendTo: "body",
					helper: "clone",
					revert: "invalid",
					zIndex:999
				});
			}
			
			if($.isFunction(settings.complete)){
				settings.complete.call(this);
			}
		});
	
	};
	
}( jQuery ));