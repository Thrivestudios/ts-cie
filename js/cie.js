$(document).ready(function(e) {
	$('.main-content').css({
		minWidth: $(window).width() - 178,
		height: $(window).height()
	});
	
	$(window).resize(function(e){
		$('.main-content').css({
			minWidth: $(window).width() - 178,
			height: $(window).height()
		});
	});
	
	/* user options */
	$('.user-wrapper').click(function(e){
		$(this).children('ul').slideToggle(100);
	});
	
	/* factile plugin call */
	$('.factile.full').factile({
		mini: false,
		dragdrop: false
	});
	
	/* factile plugin call */
	$('.factile.mini').factile({
		mini: true,
		dragdrop: true
	});
	
	/* masonry plugin call*/
	var container = $('.factile-wrapper');
	container.imagesLoaded(function(){
		container.masonry({
			itemSelector: '.factile',
			columnWidth:202,
			isFitWidth: false,
			isAnimated: true,
			isResizable: true,
			animationOptions: {
				duration: 250,
				easing: 'linear',
				queue: true
			}
		});
	});
	
	/* factile navigation */
	$('.factile-nav a').click(function(e) {
		e.preventDefault();
		if($(this).hasClass('prev')){
			$('.factile:last').animate({ opacity:0 }, 250, 
				function(){
					$('.factile-wrapper').prepend($(this).attr("style","").css({ opacity:0 }));
					$('.factile-wrapper').masonry('reload');
					$(this).animate({ opacity:1 });
				}
			);
		} else {
			$('.factile:first').animate({ opacity:0 }, 250, 
				function(){
					$('.factile-wrapper').append($(this).attr("style","").css({ opacity:0 }));
					$('.factile-wrapper').masonry('reload');
					$(this).animate({ opacity:1 });
				}
			);
		}
	});
	
	/* factile target droppable container */
	$('#selected-factiles').droppable({
		//activeClass: "ui-state-hover",
		//hoverClass: "ui-state-active",
		hoverClass: "container-hover",
		drop: function(event, ui) {
			//$(this).addClass("ui-state-highlight");
			$(this).append(ui.draggable);
			$(this).find('.placeholder').before(ui.draggable);
			ui.draggable.css({
				left: 'auto',
				top: 'auto'
			}).find('.mini-expand').hide();
		}
	});
	
	/* factile source droppable container */
	$('#available-factiles').droppable({
		//activeClass: "ui-state-hover",
		hoverClass: "container-hover",
		drop: function(event, ui) {
			//$(this).addClass("ui-state-highlight");
			$(this).append(ui.draggable);
			$(this).find('.placeholder').before(ui.draggable);
			ui.draggable.css({
				left: 'auto',
				top: 'auto'
			}).find('.mini-expand').show();
		}
	});
	
	/* factile scrollable container */
	/*
	if($(".scroll-wrapper").length > 0){
		$(".scroll-wrapper").mCustomScrollbar({
			horizontalScroll: true,
			autoDraggerLength: true,
			scrollButtons:{
				enable: false,
				scrollType: 'continuous'			
			},
			advanced:{
				autoExpandHorizontalScroll: true,
				updateOnContentResize: true
			}
		});
	}
	*/
	
	/* dropkick plugin call */
	$('#search-period, #search-type').dropkick({
		width: '100px'
	});
});