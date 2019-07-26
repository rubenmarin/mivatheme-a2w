(function(mivaJS) {
  "use strict";
  /**
  *   main Developer Ruben M.
  *   Version: 1.0.0
  *   requires: jQuery
  *   developed for: https://dieselpowerproducts.mivamerchant.net
  **/

  /****** 
    NOTES
  ******/ 

  /**********
  * UI Template:
  ***********
    - example template: `wish-list.mvt`
    - Template is saved in a miva page
    - Wish List template is pulled after page load
    - template is appended to `options.appendTo`
      - it's not wrapped in a form since we're already in a form
  **/ 

 /*******
  Template Page & JS Resource Updates
  *******
    - WLST: `page-WLST.mvt`
    - WISH: `page-WISH.mvt`
    - JavaScript Resource - Settings: mivaJS
      - mivaJS.Miva_WLST_URL = '&mvtj:urls:WLST:auto;'; 
      - mivaJS.Miva_WISH_URL = '&mvtj:urls:WISH:auto;';
  **/ 

  /*****
  * how to call this extension
  *****
    - example: PROD
    $.loadScript(theme_path + 'build-extensions/wish-list/wish-list.js', function() {
      
      //im appending to window so i can test methods through console, but not required.
      
      window.mmWishlistProd = new mivaJS.mmWishList({
        appendTo: '.x-product-layout-purchase__buttons'
      });
    });
  */
  mivaJS.mmWishList = function(options) {
    var self = this;
    
    options = options || {};
    self.options = options;

    self.myAccountLink = $('a.x-my-account-link');
    self.myAccountLinkCopy = $('a.x-my-account-link').clone(false, false);
    /*
      targets button wrapper and then finds
    */
    if(typeof self.options.wishListButton === 'string' && self.options.wishListButton != ''){
      self.wishlistButton = $(self.options.wishListButton).find('button');
      self.wishlistButtonHtml = self.wishlistButton.html();  
    }
    if (typeof options.appendTo === 'string') {
      self.wlstData = {};
      self.wlstPerPage = 100;
      self.parentElement = $(self.options.appendTo);
      self.loadElements(options, function(elements) {
        self.getItems(function(res) {
          if (typeof res === 'object') {
            self.wlstData = res;
            if (res.customerID != '') {
              $('.x-wish-list-login').remove();
              if (res.items.length >= 1) {
                self.addWishListItems(res.items);
              }
            }
          }
        });
      });
      ////
      self.events();
      /*
        Append Wish List CSS
      */
      var appendCssLink = function(){
        var head = document.head,
        link = document.createElement("link");

        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = theme_path + 'build-extensions/wish-list/wish-list.css';
        head.appendChild(link);  
      };
      appendCssLink();
    }
  };
  mivaJS.mmWishList.prototype.createWishlistShow = function() {
    var self = this;
    self.parentElement.removeClass('show-wish-list show-wish-login');
    self.parentElement.addClass('show--create');
  };
  mivaJS.mmWishList.prototype.createWishlist = function(sendItems, onDone) {
    var self = this,
      date = new Date(),
      timestamp = date.getTime(),
      defaultItems = [];
    /**/
    defaultItems.push({
      'name': 'Action',
      'value': 'IWSH'
    });
    defaultItems.push({
      'name': 'per_page',
      'value': self.wlstPerPage
    });
    defaultItems.push({
      'name': 'AJAX',
      'value': 1
    });
    defaultItems.push({
      'name': 'timestamp',
      'value': timestamp
    });

    sendItems = defaultItems.concat(sendItems);

    $.ajax({
      url: mivaJS.Miva_WLST_URL,
      type: 'POST',
      //dataType : 'json',
      data: sendItems,
    }).done(function(res) {
      if (typeof onDone === 'function') {
        onDone(res);
      } else {
        if (res.search(/^\{/) != -1) {
          res = JSON.parse(res);
          if (typeof res === 'object' && res.customerID != '') {
            if (self.wlstData.item_count < res.item_count) {
              self.wlstData = res;
              self.addWishListItems(res.items); ///update list
              var justAdded = self.wlstData.items[self.wlstData.item_count - 1];
              self.addToWishList(justAdded.id);
            }
          }
        }
      }
    });
  };
  mivaJS.mmWishList.prototype.addWishListItems = function(resItems) {
    $('.x-wish-list-items').html('');
    for (var i = 0; i < resItems.length; i++) {
      var wlItem = resItems[i];
      $('.x-wish-list-items').append('<b class="x-wish-list_item o-layout__item u-width-12" data-id="' + wlItem.id + '">' + wlItem.title + '<i class="dppicons--circle-plus"></i></b>');
    }
  };
  mivaJS.mmWishList.prototype.events = function() {
    var self = this;

    $('form').on('click', '.x-wish-creating-cancel', function(e) {
      e.preventDefault();
      self.parentElement.removeClass('show-wish-list show--create');
      self.parentElement.addClass('show-wish-list');
    });

    $('form').on('click', '.x-wish-list-create_button', function(e) {
      e.preventDefault();
      var t = $(this),
        _duplicateCheck = 0,
        _title = '',
        _hasRequired = 0,
        p = t.parents('.x-wish-list--has-inputs'),
        fields = p.find('input'),
        sendItems = [];
      if (fields.length > 0) {
        fields.map(function(i, o) {
          if (o.value != '') {
            if (o.name === 'WishList_Title') {
              _hasRequired = 1;
              _title = o.value.trim();
            }
            var originalString = o.value;
            var cleanString = originalString.replace(/(<([^>]+)>)/ig, "");
            sendItems.push({
              'name': o.name,
              'value': cleanString
            });
          }
        });
        if (_hasRequired == 1) {
          /*
            check for duplicate
          */
          if (typeof self.wlstData.items === 'object' && self.wlstData.items.length > 0) {
            var found = self.wlstData.items.filter(function(o) {
              return o.title.toLowerCase() === _title.toLowerCase();
            });
            if (found.length >= 1) {
              _duplicateCheck = 1;
            }
          }
          // no duplicate? then create & add
          if (_duplicateCheck == 0) {
            //method here
            self.createWishlist(sendItems);
          } else {
            alert('Already Exists, Try a Different Name');
          }
        } else {
          //alert('')
        }

      } else {
        console.log("oops!");
      }
      //return false;
    });

    $('form').on('keypress', '.x-is-wlst-input', function(e) {
      if (e.keyCode === 13) {
        var t = $(this),
        send = t.parents('.x-wish-list--has-inputs').find('.x-is-wlst-button');
        if (send.length > 0) {
          send.trigger('click');
        }
      }
    });

    $('form').on('click', '.x-wish-list_item', function(e) {
      e.preventDefault();
      var t = $(this),
        d = t.data();
      if ('id' in d && d.id != '') {
        self.addToWishList(d.id);
      }
    });
    $('form').on('click', '.x-wish-list-create-link', function(e) {
      self.createWishlistShow();
    });

    /**
     *
     **/
    if('wishListButton' in self.options && self.options.wishListButton != ''){
      $(self.options.wishListButton).on('click', function(e) {
        e.preventDefault();

        // We should always have this member available
        // If we don't then the AJAX request hasn't finished
        if (!self.wlstData.hasOwnProperty("customerID")) return;
       
        if (self.wishlistButton.hasClass('wl--active')) {
          self.wishlistButton.html(self.wishlistButtonHtml);
        } else {
          self.wishlistButton.html('Cancel');
        }

        self.wishlistButton.toggleClass('wl--active');

        if (self.wlstData.customerID != '') { 
          if (self.parentElement.hasClass('show-wish-list')) {
            self.parentElement.removeClass('show-wish-list show--create show-wish-login');
          } else {
            self.parentElement.addClass('show-wish-list');
          }
        } else {
          if (self.parentElement.hasClass('show-wish-login')) {
            self.parentElement.removeClass('show-wish-list show--create show-wish-login');
          } else {
            self.parentElement.addClass('show-wish-login');
          }

        }
      });  
    }
    /**
     *
     **/
    $('form').on('click', '.x-wish-list_button', function(e) {
      e.preventDefault();
      var t = $(this),
        p = t.parents('.x-wish-list-login'),
        fields = p.find('input');
      var sendItems = [];
      var date = new Date();
      var timestamp = date.getTime();
      sendItems.push({
        'name': 'AJAX',
        'value': 1
      });
      sendItems.push({
        'name': 'per_page',
        'value': self.wlstPerPage
      });
      sendItems.push({
        'name': 'timestamp',
        'value': timestamp
      });
      sendItems.push({
        'name': 'Action',
        'value': 'LOGN'
      });
      if (fields.length > 0) {
        fields.map(function(i, o) {
          if (o.value != '') {
            sendItems.push({
              'name': o.name,
              'value': o.value
            });
          }
        });
      }
      self.parentElement.addClass('x-wlst-ajax--try');
      if (sendItems.length >= 5) {
        $.ajax({
          url: mivaJS.Miva_WLST_URL,
          type: 'POST',
          //dataType : 'json',
          data: sendItems,
        }).done(function(res) {
          if (res.search(/^\{/) != -1) {
            res = JSON.parse(res);
            if (typeof res === 'object' && res.customerID != '') {

              /*
                once logged in replace the 'My account link';
              */
              var accountCopy = self.myAccountLinkCopy;
              accountCopy.html('Welcome, ' + res.customerLogin);
              self.myAccountLink.replaceWith(accountCopy);

              self.wlstData.customerID = res.customerID;
              self.wlstData = res;
              self.wishlistButton.html('cancel');
     
              self.addWishListItems(res.items);
              self.parentElement.removeClass('show-wish-login x-wlst-ajax--try');
              self.parentElement.addClass('show-wish-list');

              $('.x-wish-list-login').remove();

            }
          } else {
            self.parentElement.removeClass('x-wlst-ajax--try');
            alert('Incorrect Password?');
          }
        });

      } else {
        console.log("ooops!");
      }

    });
  };
  mivaJS.mmWishList.prototype.getItems = function(callback) {
    var self = this;
    var dataDefault = {
      'AJAX': 1,
      'Action': 'ATWL',
      'per_page': self.wlstPerPage
    };
    $.ajax({
      url: mivaJS.Miva_WLST_URL,
      type: 'POST',
      dataType: 'json',
      data: $.param(dataDefault),
    }).done(function(res) {
      if (typeof callback === 'function') {
        callback(res);
      }
    });
  };
  mivaJS.mmWishList.prototype.addToWishList = function(id) {
    var self = this;
    var purchaseForm = document.querySelector('[data-hook="purchase"]'),
      formData = $('[data-hook="purchase"]').serializeArray();
    formData.map(function(o, i) {
      if (o.name == 'Action') {
        o.value = "ATWL";
      }
    });
    if (id != -1) {
      formData.push({
        'name': 'WishList_ID',
        'value': id
      });
      formData.push({
        'name': 'WishList_Shared',
        'value': 'Yes'
      });
    }
    $.ajax({
      url: mivaJS.Miva_WISH_URL,
      type: 'POST',
      data: formData,
    }).done(function(response) {
      var messages = $(response).find('#messages.readytheme-contentsection');
      var errorMessage = messages.find('.x-messages--error');
      if (errorMessage.length > 0) {
        alert('Unable to add product to');
      } else {
        self.parentElement.removeClass('show-wish-list show--create show-wish-login');
        //alert('product was added');

        self.wishlistButton.html('Success');
        self.parentElement.addClass('was--added');
        self.wishlistButton.removeClass('wl--active');

        setTimeout(function() {
          self.wishlistButton.html(self.wishlistButtonHtml);
          self.parentElement.removeClass('was--added');
        }, 1500);
      }
    });
  };
  /******
      this calls a miva page that has our wish list templates
  ******/ 
  mivaJS.mmWishList.prototype.loadElements = function(options, callback) {
    var self = this;
    $.ajax({
      url: '/a2w-elements.html',
      type: 'GET',
    })
    .done(function(res) {
      self.parentElement.addClass('u-pos-relative x-wish-list-loaded');
      self.parentElement.append(res);
      if (typeof callback === 'function') {
        callback(res);
      }
    })
    .fail(function(res) {
      console.log("error");
    });
  };
}(window.mivaJS || (window.mivaJS = {})));