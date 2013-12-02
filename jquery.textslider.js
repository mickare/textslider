/*!
 * jQuery Textslider 0.0.2
 *
 * Copyright 2013, Michael Käser
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Soft-Depends:
 *  jQuery UI Touch Punch is © 2011David Furfero and dual licensed under the MIT or GPL Version 2 licenses.
 */
(function () {

    // Mathematical Ring calculation
    function ring(z, n) {
        if (z < 0) {
            return Math.abs(n + (z % n));
        } else if (z >= n) {
            return z % n;
        }
        return z;
    }

    // Underscore's isFunction function
    function isFunction(obj) {
        return !!(obj && obj.constructor && obj.call && obj.apply);
    }

    // Checks whether n is an integer.
    function isInt(n) {
        return typeof n === 'number' && parseFloat(n) == parseInt(n, 10) && !isNaN(n);
    }

    // Basic Constructor with defaults
    var textslider = function (options) {
        var self = this;

        if (!(options.container.nodeType)) {
            console.log("[textslider][ERROR] No container!");
            return;
        }

        // Container of the Slide
        this.container = options.container;

        // Show/Hide Animation Settings
        this.sliderAnimate = {
            bg: {
                show: {
                    speed: 400,         // animation duration
                    easing: "swing"     // animation easing
                },
                hide: "auto"            // auto - same speed options as the new visible element
            },
            fg: {
                show: {
                    speed: 500,         // animation duration
                    easing: "swing"     // animation easing
                },
                hide: "auto"            // auto - same animate options as the new visible element
            }
        };

        // Show Controls at the beginning? (Default: FadeIn(700))
        this.doShowControl = true;

        // Default Control Icons
        this.control_ButtonLeft = '<span style="position:relative; left:-2px;">&laquo;</span>';
        this.control_ButtonRight = '<span style="position:relative; left:1px;">&raquo;</span>';

        // Hooks
        this.onChange = function (page, direction) { return true; };                // general page change (return false if cancelled)
        this.onDirectionChange = function (page, direction) { return true; };       // directional page change (return false if cancelled)
        this.onDirectionClick = function (page, direction) { return true; };        // direction page change click (return false if cancelled)
        this.onButtonClick = function (page) { return true; };                      // page buttons click (return false if cancelled)
        this.onAutoSlideToggleClick = function (newStatus) { return true; };        // autoslide toggle click (return false if cancelled)
        this.onControl = function (page) { this.stopAutoSlide(); return true; };    // click on a control element (return false if cancelled)
        this.onTouchDrag = function (page) { return true; }                         // touch dragging (return false if cancelled)
        this.onReloaded = function () { };                                          // controls reloaded
        this.onAutoSlide = function () { self.next(); };                            // AutoSlide function that is triggered in the auto slide interval

        // AutoSlide
        this.autoSlide = true;                              // Start autoSlide ?
        this.autoSlide_IntervalDelay = 7000;                // Slide Interval Delay
        this.autoSlide_Interval;                            // interval set via "window.setInterval"
        this.autoSlide_PlayButton = '<span style="margin:0; padding:0; font-size:16px;">&#x25BA;</span>';             // Default Play Button
        this.autoSlide_PauseButton = '<span style="margin:0; padding:0;font-size:10px; position:relative; top: -2px; left: 1px;">&#x258C;&#x258C;</span>'    // Default Pause Button
        //this.autoSlide_PauseButton = '<span style="letter-spacing:0; font-size-adjust:16px;">&#x25AE;&#x25AE;</span>'    // Default Pause Button

        // Touchdistance Function to calculate the distance needed to trigger a page change.
        this.touchdistance = function () {
            return $(self.container).width() / 4;
        }

        // Default is the browser touch support, if you want swipe also with mouse then set this to true.
        this.touchsupport = 'ontouchend' in document;

        // Touch Draggable Options !!! don't override if you don't know what you are doing !!!
        this.touchdragable = {
            axis: "x",
            revert: true,
            distance: self.touchdistance(),
            helper: function () { return $('<div class="slider-draghelper slider-box" style="position:absolute; top:0; left:0; z-index:150;"></div>')[0]; },
            drag: function (event, ui) {
                if (Math.abs(ui.position.left) < self.touchdistance()) {
                    return;
                }
                if (ui.position.left > 0) {
                    var page = self.previousPage();
                    if (!self.onTouchDrag(page)) {
                        return false;
                    }
                    if (!self.onControl(page)) {
                        return false;
                    }
                    self.previous();
                } else if (ui.position.left < 0) {
                    var page = self.nextPage();
                    if (!self.onTouchDrag(page)) {
                        return false;
                    }
                    if (!self.onControl(page)) {
                        return false;
                    }
                    self.next();
                }
                return false;
            }
        }

        // Melt the options with the defaults, overwriting the defaults.
        $.extend(true, this, options);
    };

    $.fn.textslider = function (method) {

        // No container?
        if (this.length == 0) {
            console.log("[textslider][ERROR] No container!");
            return;
        }

        // Multiple containers?
        if (this > 1) {
            console.log("[textslider][WARNING] Warning multiple containers found! Using only first one!");
        }



        // Create textslider && set container
        var obj = new textslider($.extend({}, method, { container: this[0] }));

        if ($(obj.container).has(".slider-control.slider-control-arrow.slider-control-left")) {
            $(obj.container).append($('<div class="slider-control slider-control-arrow slider-control-left">' + obj.control_ButtonLeft + '</div>'));
        }

        if ($(obj.container).has(".slider-control.slider-control-arrow.slider-control-right")) {
            $(obj.container).append($('<div class="slider-control slider-control-arrow slider-control-right">' + obj.control_ButtonRight + '</div>'));
        }

        if ($(obj.container).has(".slider-control.slider-control-buttons")) {
            $(obj.container).append($('<div class="slider-control slider-control-buttons"><div><ul></ul></div></div>'));
        }

        if ($(obj.container).has(".slider-control.slider-control-autoslide-toggle")) {
            $(obj.container).append($('<div class="slider-control slider-control-autoslide-toggle"><div class="play">' + obj.autoSlide_PlayButton + '</div><div class="pause">' + obj.autoSlide_PauseButton + '</div></div>'));
        }

        $(obj.container).addClass("slider").addClass("slider-box");

        // Repair Touch Dragable Distance:
        obj.touchdragable.distance = obj.touchdistance();

        // Round Button Click
        obj._onButtonClick = function (event) {
            //event.stopPropagation();
            /*
            if ($(this).hasClass("slider-active")) {
                return;
            }
            */
            var page = $(this).index();
            if (!obj.onButtonClick(page)) {
                return;
            }
            if (!obj.onControl(page)) {
                return;
            }
            obj.change(page);
        };
        $(obj.container).children(".slider-control-buttons").on("click", "li", obj._onButtonClick);

        // Left Button Click (Previous)
        obj._onLeftClick = function (event) {
            //event.stopPropagation();
            var page = obj.previousPage();
            if (!obj.onDirectionClick(page, "left")) {
                return;
            }
            if (!obj.onControl(page)) {
                return;
            }
            obj.previous();
        };
        $(obj.container).children(".slider-control-left").on("click", obj._onLeftClick);

        // Right Button Click (Next)
        obj._onRightClick = function (event) {
            //event.stopPropagation();
            var page = obj.nextPage();
            if (!obj.onDirectionClick(page, "right")) {
                return;
            }
            if (!obj.onControl(page)) {
                return;
            }
            obj.next();
        };
        $(obj.container).children(".slider-control-right").on("click", obj._onRightClick);

        // Autoslide Toggler Click
        obj._onAutoSlideToggleClick = function (event) {
            var futureAutoSlide = !$(obj.container).hasClass("slider-autoslide");
            if (!obj.onAutoSlideToggleClick(futureAutoSlide)) {
                return;
            }
            if (!obj.onControl(obj.currentPage())) {
                return;
            }
            if (futureAutoSlide) {
                obj.startAutoSlide();
            } else {
                obj.stopAutoSlide();
            }
        }
        $(obj.container).children(".slider-control-autoslide-toggle").on("click", obj._onAutoSlideToggleClick);

        // Touch Support
        if (obj.touchsupport) {
            $(obj.container).draggable(obj.touchdragable);
        }

        // Initialize Buttons
        obj.reload();

        if (obj.doShowControl) {
            obj.showControl();
        }

        if (obj.autoSlide) {
            obj.startAutoSlide();
        }

        return obj;
    };

    textslider.prototype = {
        startAutoSlide: function (delay) {
            if (isInt(delay)) {
                this.autoSlide_IntervalDelay = delay;
            }
            this.stopAutoSlide();
            this.autoSlide_Interval = setInterval(this.onAutoSlide, this.autoSlide_IntervalDelay);
            $(this.container).addClass("slider-autoslide");
        },
        stopAutoSlide: function () {
            clearInterval(this.autoSlide_Interval);
            $(this.container).removeClass("slider-autoslide");
        },
        showControl: function (callback) {
            $(this.container).children(".slider-control").fadeIn(700);
            if (isFunction(callback)) {
                window.setTimeout(callback, 0);
            }
            $(this.container).removeClass("slider-control-hidden").addClass("slider-control-visible");
        },
        hideControl: function (callback) {
            $(this.container).children(".slider-control").fadeOut(700);
            if (isFunction(callback)) {
                window.setTimeout(callback, 0);
            }
            $(this.container).removeClass("slider-control-visible").addClass("slider-control-hidden");
        },
        disable: function () {
            this.stopAutoSlide();
            this.hideControl();
            this.disableTouch();
        },
        enable: function () {
            this.showControl();
            this.enableTouch();

            if (this.autoSlide) {
                this.startAutoSlide();
            }
        },
        hasTouchEnabled: function () {
            return ($(this.container).hasClass("ui-draggable") ? !$(this.container).draggable("option", "disabled") : false);
        },
        disableTouch: function () {
            $(this.container).draggable("disable");
        },
        enableTouch: function () {
            if (this.touchsupport) {
                if ($(this.container).hasClass("ui-draggable")) {
                    $(this.container).draggable("enable");
                } else {
                    $(obj.container).draggable(obj.touchdragable);
                }
            } else {
                console.log("[textslider][ERROR] no touch supported! (touchsupport = false)");
            }
        },
        reload: function (callback) {

            var buttonsHtml = '';
            $(this.container).children(".slider-bg").each(function () {
                buttonsHtml += '<li><div class="slider-button"></div></li>';
            });
            $(this.container).find(" > .slider-control-buttons > div > ul").html(buttonsHtml);

            $(this.container).children(".slider-bg").hide().addClass("slider-box");
            $(this.container).children(".slider-fg").hide().addClass("slider-box").removeClass("slider-active");

            var $old = $(this.container).children(".slider-bg.slider-active");

            var oldpos = $(this.container).children(".slider-bg").index($old);

            if ($old.length > 0) {
                $(this.container).find("> .slider-control-buttons > div > ul > li:eq(" + oldpos + ")").addClass("slider-active");
                $old.css({ 'left': 0 }).show();
                if (typeof $old.data("slider-fg") != "undefined") {
                    $(this.container).children(".slider-fg").filter($old.data("slider-fg")).css({ 'left': 0 }).addClass("slider-active").show();
                }

                $(this.container).children($old.data("slider-fg")).css({ 'left': 0 }).show();
            } else {
                $(this.container).find("> .slider-control-buttons > div > ul > li:first").addClass("slider-active");
                $old = $(this.container).children(".slider-bg:first").addClass("slider-active").css({ 'left': 0 }).show();
                if (typeof $old.data("slider-fg") != "undefined") {
                    $(this.container).children(".slider-fg").filter($old.data("slider-fg")).css({ 'left': 0 }).addClass("slider-active").show();
                }
            }

            this.onReloaded();
            if (isFunction(callback)) {
                callback();
            }
        },
        destroy: function () {
            this.stopAutoSlide();
            $(this.container).children(".slider-control-buttons").unbind("click", this._onButtonClick);
            $(this.container).children(".slider-control-left").unbind("click", this._onLeftClick);
            $(this.container).children(".slider-control-right").unbind("click", this._onRightClick);
            $(this.container).children(".slider-control-autoslide-toggle").unbind("click", this._onAutoSlideToggleClick);
            $(this.container).draggable("destroy");
            this.hideControl();
        },
        countPages: function () {
            return $(this.container).children(".slider-bg").length;
        },
        currentPage: function () {
            return $(this.container).children(".slider-bg").index($(this.container).children(".slider-bg.slider-active"));
        },
        previousPage: function () {
            return ring(this.currentPage() - 1, this.countPages());
        },
        nextPage: function () {
            return ring(this.currentPage() + 1, this.countPages());
        },
        previous: function () {
            var page = this.previousPage();
            if (!this.onDirectionChange(page, "left")) {
                return;
            }
            this.change(page, "left");
        },
        next: function () {
            var page = this.nextPage();
            if (!this.onDirectionChange(page, "right")) {
                return;
            }
            this.change(page, "right");
        },
        change: function (page, direction) {

            if (!this.onChange(page, direction)) {
                return;
            }

            var pages = this.countPages();

            if (pages == 0) {
                return;
            }

            //calculate page number
            page = ring(page, pages);

            var $bgs = $(this.container).children(".slider-bg");
            var $fgs = $(this.container).children(".slider-fg");

            // Get Pages
            var $old = $(this.container).children(".slider-bg.slider-active");

            // Abort if the old page is the new page!
            if (page == $bgs.index($old)) { return; }

            $(this.container).find(".slider-old").removeClass("slider-old");
            $(this.container).find(".slider-active").addClass("slider-old").removeClass("slider-active");
            var $new = $(this.container).children(".slider-bg:eq(" + page + ")").addClass("slider-active");

            $old = $old.not($new);

            // Guess the direction, if not given!
            if (direction != "left" && direction != "right") {
                direction = "left";
                if (page > $bgs.index($old)) {
                    direction = "right";
                }
            }

            // Calculate the starting points
            var newstart = -$(this.container).width();
            var oldend = $(this.container).width();
            if (direction == "right") {
                newstart = -1 * newstart;
                oldend = -1 * oldend;
            }

            // Get Text Elements
            var $new_text = $();
            if (typeof $new.data("slider-fg") != "undefined") {
                $new_text = $(this.container).children($new.data("slider-fg")).addClass("slider-active");
            }
            var $old_text = $(this.container).children(".slider-fg.slider-old").not($new_text);

            // Set startposition for the new element!
            $new.stop().css({ 'left': newstart }).show();
            $new_text.stop().css({ 'left': newstart }).show();
            $old.stop().css({ 'left': 0 });
            $old_text.stop();
            /*
            .css({ 'left': 0 });
            */

            $new.trigger("slider-activated");
            $new_text.trigger("slider-activated");

            var self = this;

            // New BG Speed
            var speednew = this.sliderAnimate.bg.show != "auto" ? self.sliderAnimate.bg.show.speed : 400;
            var easingnew = this.sliderAnimate.bg.show != "auto" ? self.sliderAnimate.bg.show.easing : "swing";
            if (typeof $new.data("slider-speedin") != "undefined") {
                speednew = parseInt($new.data("slider-speedin"));
            }
            if (typeof $new.data("slider-easing") != "undefined") {
                easingnew = $new.data("slider-easing");
            }

            // Animate new BG
            $new.animate({
                left: 0
            },{
                duration: speednew,
                easing: easingnew,
                complete: function () {
                    $old.stop(true).hide().trigger("slider-deactivated");
                    $old_text.stop(true).hide().trigger("slider-deactivated");
                }
            });
            // Animate new FG
            $new_text.each(function (index, element) {
                var speed = self.sliderAnimate.fg.show != "auto" ? self.sliderAnimate.fg.show.speed : speednew;
                var easing = self.sliderAnimate.fg.show != "auto" ? self.sliderAnimate.fg.show.easing : easingnew;
                if (typeof $(this).data("slider-speedin") != "undefined") {
                    speed = parseInt($(this).data("slider-speedin"));
                }
                if (typeof $(this).data("slider-easing") != "undefined") {
                    easing = $(this).data("slider-easing");
                }
                $(this).animate({
                    left: 0
                },{ 
                    duration: speed,
                    easing: easing
                });

            });

            // Old BG speed

            var speedold = this.sliderAnimate.bg.hide != "auto" ? self.sliderAnimate.bg.hide.speed : speednew;
            var easingold = this.sliderAnimate.bg.hide != "auto" ? self.sliderAnimate.bg.hide.easing : easingnew;;
            if (typeof $old.data("slider-speedout") != "undefined") {
                speedold = parseInt($old.data("slider-speedout"));
            }
            if (typeof $old.data("slider-easing") != "undefined") {
                easingold = $old.data("slider-easing");
            }

            // Animate old BG
            $old.animate({
                left: oldend
            },{ 
                duration: speedold,
                easing: easingold
            });
            // Animate new FG
            $old_text.each(function (index, element) {
                var speed = self.sliderAnimate.fg.hide != "auto" ? self.sliderAnimate.fg.hide.speed : speedold;
                var easing = self.sliderAnimate.fg.show != "auto" ? self.sliderAnimate.fg.show.easing : easingnew;
                if (typeof $(this).data("slider-speedout") != "undefined") {
                    speed = parseInt($(this).data("slider-speedout"));
                }
                if (typeof $(this).data("slider-easing") != "undefined") {
                    easing = $(this).data("slider-easing");
                }
                $(this).animate({
                    left: oldend
                }, {
                    duration: speed,
                    easing: easing
                });
            });

            // Change Buttons
            $(this.container).find("> .slider-control-buttons > div > ul > li.slider-active").removeClass("slider-active");
            $(this.container).find("> .slider-control-buttons > div > ul > li:eq(" + page + ")").addClass("slider-active");
        }
    };

})();