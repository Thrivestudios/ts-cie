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
});