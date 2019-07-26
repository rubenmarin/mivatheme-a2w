# mivatheme-a2w
Add to wishlist

 ## NOTES



### UI Template:

  - example template: `wish-list.mvt`
  - Template is saved in a miva page
  - Wish List template is pulled after page load
  - template is appended to `options.appendTo`
    - it's not wrapped in a form since we're already in a form



### Template Page & JS Resource Updates

  - WLST: `page-WLST.mvt`
  - WISH: `page-WISH.mvt`
  - JavaScript Resource - Settings: mivaJS
    - mivaJS.Miva_WLST_URL = '&mvtj:urls:WLST:auto;'; 
    - mivaJS.Miva_WISH_URL = '&mvtj:urls:WISH:auto;';


### how to call this extension
  - example: PROD
  ```js
  $.loadScript(theme_path + 'build-extensions/wish-list/wish-list.js', function() {
    
    //im appending to window so i can test methods through console, but not required.
    window.mmWishlistProd = new mivaJS.mmWishList({
      appendTo: '.x-product-layout-purchase__buttons',
      wishListButton : '.x-is-wishlist-button'
    });
  });
  ```

