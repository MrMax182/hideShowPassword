(function (factory, global) {

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else {
    // Browser globals.
    factory(global.jQuery);
  }

}(function ($, undef) {

  var dataKey = 'plugin_hideShowPassword';

  var defaults = {

    show: 'infer',
    innerToggle: false,
    touchSupport: false,

    className: 'hideShowPassword-field',
    eventName: 'passwordVisibilityChange',
    props: {
      autocapitalize: 'off',
      autocomplete: 'off',
      autocorrect: 'off',
      spellcheck: 'false'
    },

    toggle: {
      element: '<button>',
      className: 'hideShowPassword-toggle',
      hideUntil: null,
      attachToEvent: 'click',
      attachToTouchEvent: 'touchstart mousedown',
      styles: { position: 'absolute' },
      position: 'infer',
      verticalAlign: 'middle'
    },

    wrapper: {
      element: '<div>',
      className: 'hideShowPassword-wrapper',
      enforceWidth: true,
      styles: { position: 'relative' },
      inheritStyles: [
        'display',
        'vertical-align',
        'margin-top',
        'margin-right',
        'margin-bottom',
        'margin-left'
      ],
      innerElementStyles: {
        marginTop: 0,
        marginRight: 0,
        marginBottom: 0,
        marginLeft: 0
      }
    },

    states: {
      shown: {
        className: 'hideShowPassword-shown',
        eventName: 'passwordShown',
        props: { type: 'text' },
        toggle: {
          className: 'hideShowPassword-toggle-hide',
          content: 'Hide',
          attr: { 'aria-pressed': 'true' }
        }
      },
      hidden: {
        className: 'hideShowPassword-hidden',
        eventName: 'passwordHidden',
        props: { type: 'password' },
        toggle: {
          className: 'hideShowPassword-toggle-show',
          content: 'Show',
          attr: { 'aria-pressed': 'false' }
        }
      }
    }

  };

  function HideShowPassword (element, options) {
    this.element = $(element);
    this.wrapperElement = $();
    this.toggleElement = $();
    this.init(options);
  }

  HideShowPassword.prototype = {

    init: function (options) {
      this.update(options, defaults);
      if (this.options.innerToggle) {
        this.initWrapper();
        this.initToggle();
      }
    },

    update: function (options, base) {
      var currentType = this.element.prop('type');
      base = base || this.options;
      options = $.extend(true, {}, base, options);
      if (options.show === 'toggle') {
        options.show = (currentType === options.states.hidden.props.type);
      }
      if (options.show === 'infer') {
        options.show = (currentType === options.states.shown.props.type);
      }
      if (options.toggle.position === 'infer') {
        options.toggle.position = (this.element.css('text-direction') === 'rtl') ? 'left' : 'right';
      }
      this.options = options;
      if (currentType !== this.state().props.type) {
        this.element
          .prop($.extend({}, this.options.props, this.state().props))
          .addClass(this.options.className + ' ' + this.state().className)
          .removeClass(this.otherState().className);
        if (this.toggleElement.length) {
          this.updateToggle();
        }
        this.element
          .trigger(this.options.eventName)
          .trigger(this.state().eventName);
      }
    },

    state: function (key, invert) {
      if (key === undef) {
        key = this.options.show;
      }
      if (typeof key === 'boolean') {
        key = key ? 'shown' : 'hidden';
      }
      if (invert) {
        key = (key === 'shown') ? 'hidden' : 'shown';
      }
      return this.options.states[key];
    },

    otherState: function (key) {
      return this.state(key, true);
    },

    initWrapper: function () {
      var wrapperStyles = this.options.wrapper.styles
        , enforceWidth = this.options.wrapper.enforceWidth
        , elementWidth = this.element.outerWidth();

      $.each(this.options.wrapper.inheritStyles, $.proxy(function (index, prop) {
        wrapperStyles[prop] = this.element.css(prop);
      }, this));

      this.element.wrap(
        $(this.options.wrapper.element)
          .addClass(this.options.wrapper.className)
          .css(wrapperStyles)
      );
      this.wrapperElement = this.element.parent();

      this.element.css(this.options.wrapper.innerElementStyles);

      if (enforceWidth === true) {
        enforceWidth = (this.wrapperElement.outerWidth() === elementWidth) ? false : elementWidth;
      }
      if (enforceWidth !== false) {
        this.wrapperElement.css('width', enforceWidth);
      }
    },

    initToggle: function () {
      this.toggleElement = $(this.options.toggle.element)
        .addClass(this.options.toggle.className)
        .css(this.options.toggle.styles)
        .appendTo(this.wrapperElement);
      this.updateToggle();

      this.toggleElement.css(this.options.toggle.position, 0);
      this.element.css('padding-' + this.options.toggle.position, this.toggleElement.outerWidth());

      switch (this.options.toggle.verticalAlign) {
        case 'top':
        case 'bottom':
          this.toggleElement.css(this.options.toggle.verticalAlign, 0);
          break;
        case 'middle':
          this.toggleElement.css({
            top: '50%',
            marginTop: (this.toggleElement.outerHeight() / -2)
          });
          break;
        case 'stretch':
          this.toggleElement.css({
            top: 0,
            bottom: 0
          });
          break;
      }

      if (this.options.touchSupport) {
        this.toggleElement.css('pointer-events', 'none');
        this.element.on(this.options.toggle.attachToTouchEvent, $.proxy(function (event) {
          var toggleX = this.toggleElement.offset().left
            , eventX
            , lesser
            , greater;
          if (toggleX) {
            eventX = event.pageX || event.originalEvent.pageX;
            if (this.options.toggle.position === 'left') {
              toggleX+= this.toggleElement.outerWidth();
              lesser = eventX;
              greater = toggleX;
            } else {
              lesser = toggleX;
              greater = eventX;
            }
            if (greater >= lesser) {
              event.preventDefault();
              this.update({ show: 'toggle' });
            }
          }
        }, this));
      } else {
        this.toggleElement.on(this.options.toggle.attachToEvent, $.proxy(function (event) {
          event.preventDefault();
          this.update({ show: 'toggle' });
        }, this));
      }
    },

    updateToggle: function () {
      this.toggleElement
        .attr(this.state().toggle.attr)
        .addClass(this.state().toggle.className)
        .removeClass(this.otherState().toggle.className)
        .html(this.state().toggle.content);
    }

  };

  // var getSetInputPropSupport = (function(){
  //   var supported = true
  //     , testElement = $('<input>')
  //       .prop('type', 'password')
  //       .css({
  //         left: 0,
  //         height: 1,
  //         opacity: 0,
  //         overflow: 'hidden',
  //         position: 'absolute',
  //         top: 0,
  //         width: 1
  //       })
  //       .appendTo('body');
  //   try {
  //     testElement.prop('type', 'text');
  //   } catch (error) {
  //     supported = false;
  //   }
  //   // testElement.remove();
  //   return supported;
  // }());

  // console.log(getSetInputPropSupport);

  $.fn.hideShowPassword = function () {
    var options = (arguments[0] === undef) ? {} : arguments[0];
    if (typeof options !== 'object') {
      options = { show: options };
    }
    if (arguments[1] !== undef) {
      $.extend(
        options,
        typeof arguments[1] === 'object' ? arguments[1] : { innerToggle: arguments[1] }
      );
    }
    if (typeof arguments[2] === 'object') {
      $.extend(options, arguments[2]);
    }
    return this.each(function(){
      var $this = $(this);
      var data = $this.data(dataKey);
      if (data) {
        data.update(options);
      } else {
        $this.data(dataKey, new HideShowPassword(this, options));
      }
    });
  };

  $.each({ 'show':true, 'hide':false, 'toggle':'toggle' }, function (verb, showVal) {
    $.fn[verb + 'Password'] = function (innerToggle, options) {
      return this.hideShowPassword(showVal, innerToggle, options);
    };
  });

}, this));