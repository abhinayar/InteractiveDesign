//scroll to
    // HTML e.g <a href="#footer" data-offset="100">Go to footer</a>
    $('a[href*="#"]:not([href="#"])').click(function() {

        if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {

            var target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
            if (target.length) {
                    
            //lets us set the vertical offest in px e.g data-offset="100"
            var attr = $(this).attr('data-offset');
            if( attr == undefined ){ attr = 0; }

            //console.log(attr);

            $('html,body').animate({ scrollTop: target.offset().top-attr }, 5000);
            return false;

            }
        }
    });


    //overide scrolljacking
    $('html,body').on("scroll mousedown wheel DOMMouseScroll mousewheel keyup touchmove", function(){         $('html,body').stop(); });





(function($,sr){
  
  // debouncing function from John Hann
  // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
  var debounce = function (func, threshold, execAsap) {
      var timeout;

      return function debounced () {
          var obj = this, args = arguments;
          function delayed () {
              if (!execAsap)
                  func.apply(obj, args);
              timeout = null;
          };

          if (timeout)
              clearTimeout(timeout);
          else if (execAsap)
              func.apply(obj, args);

          timeout = setTimeout(delayed, threshold || 100);
      };
  }
	// smartresize
	jQuery.fn[sr] = function(fn){  return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr); };

})(jQuery,'smartresize');



;(function (jQuery) {
    "use strict";
    
  
// Video background parent
  function resize_background_video() {
    jQuery('.video-section .bg-video').each(function () {
      var $vid = jQuery(this), 
          $section = $vid.parent(), 
          windowWidth = $section.width(), 
          windowHeight = $section.outerHeight(), 
          r_w = windowHeight / windowWidth, 
          i_w = $vid.width(), 
          i_h = $vid.height(), 
          r_i = i_h / i_w, new_w, new_h;
      if (r_w > r_i) {
        new_h = windowHeight;
        new_w = windowHeight / r_i;
      } else {
        new_h = windowWidth * r_i;
        new_w = windowWidth;
      }
      $vid.css({
        width : new_w,
        height : new_h,
        left : (windowWidth - new_w) / 2,
        top : (windowHeight - new_h) / 2
      });
    });
  }
  
// Video Background 
  jQuery('.video-section .bg-video').load();
  jQuery('.video-section .bg-video').on("loadedmetadata", function () {
    jQuery(this).css({
      width: this.videoWidth,
      height: this.videoHeight
    });
    resize_background_video();
    jQuery(this).css('display', 'block');
  });
  
  jQuery(window).smartresize(function () {
    resize_background_video();       
  });
  
}(jQuery));



//http://prinzhorn.github.io/skrollr/

// Init Skrollr
 
var s = skrollr.init({
  smoothScrolling: false,
  forceHeight: false
 
});
// Seek video

		// Cross browser animation
    // https://gist.github.com/Warry/4254579#beware-of-reflows
    var animFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        // IE Fallback, you can even fallback to onscroll
        function(callback){ window.setTimeout(callback, 1000/60) };

    function seek()
    {
      $('video[data-time]').each(function()
                                 {
        var $video = $(this);
        //var ratio = parseFloat( $video.attr('data-time') ).toFixed(2); // Uses Skrollr to get scroll ratio
        //ratio = ratio / 3;
        var ratio = $('body').scrollTop() / $('body').height();
        var duration = $video[0].duration; // Total video time

        // Seek through video (if video seems loaded)
        if( duration ) $video[0].currentTime = duration * ratio;
      });            

      // Repeat
      animFrame(seek);
    }

    $('video[data-time]').on('loadedmetadata', function(e)
                             {
      // Launch first animation
      animFrame(seek);
    });