$(document).ready(function(e) {
	$('.factile.mini').factile({
		mini: true,
		dragdrop: true
	});
	
	$('.factile.full').factile({
		mini: false,
		dragdrop: false
	});
	
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
	
	//$('#available-factiles').droppable({
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
	
	if($(".scroll-wrapper").length > 0){
		$(".scroll-wrapper").mCustomScrollbar({
			horizontalScroll: true,
			autoDraggerLength: true,
			scrollButtons:{
				enable: true,
				scrollType: 'continuous'			
			},
			advanced:{
				autoExpandHorizontalScroll: true,
				updateOnContentResize: true
			}
		});
	}
	
	/* masonry */
	var container = $('.factile-wrapper');
	container.imagesLoaded(function(){
		container.masonry({
			itemSelector: '.factile',
			columnWidth:202,
			isFitWidth: true,
			isAnimated: true,
			isResizable: true,
			animationOptions: {
				duration: 250,
				easing: 'linear',
				queue: true
			}
		});
	});
	
	$('.addMasonry').click(function(e){
		e.preventDefault();
		console.log('reloading!');
		$('.factile-wrapper').masonry('reload');
	});
	
	$('.prevFactile').click(function(e) {
		console.log('Previous factile');
		e.preventDefault();
		$('.factile:last').animate({ opacity:0 }, 250, 
			function(){
				$('.factile-wrapper').prepend($(this).attr("style","").css({ opacity:0 }));
				$('.factile-wrapper').masonry('reload');
				$(this).animate({ opacity:1 });
			}
		);
		//$('.factile.empty').replaceWith(factile);
		//factile.animate({ opacity:1 }, 250);
	});
	
	$('.nextFactile').click(function(e) {
		console.log('Next factile');
		e.preventDefault();
		$('.factile:first').animate({ opacity:0 }, 250, 
			function(){
				$('.factile-wrapper').append($(this).attr("style","").css({ opacity:0 }));
				$('.factile-wrapper').masonry('reload');
				$(this).animate({ opacity:1 });
			}
		);
		//$('.empty').replaceWith(factile);
		//factile.animate({ opacity:1 }, 250);
	});
});