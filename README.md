[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0) [![Build Status][travis-badge]][travis-badge-url]

![](./src/images/hystrix-logo-tagline-tiny.png)

**HystrixViewer.js** is a simple JavaScript library for monitoring Hystrix Metrics in real time.
It's a port of [Hystrix Dashboard](https://github.com/Netflix/Hystrix/tree/master/hystrix-dashboard) and relies on 
Hystrix metrics instead of Hystrix stream.

# Examples
This library is very easy to use. You can create a Hystrix Dashboard by calling `addHystrixDashboard` method. 
The method takes a div id.

```js  
hystrixViewer.addHystrixDashboard('#hystrix-div');
hystrixViewer.refresh(data);
```

The viewer can be updated by calling `refresh` method.

```js  
hystrixViewer.refresh(data);
```

## Get Started
1. Download all the javascript and css files from [dist](dist) directory.
2. The documentation and working example can be found here in [demo](demo).


## Dependencies
The HystrixViewer depends on the following libraries:
1. [D3](http://d3js.org) is a JavaScript library for manipulating documents based on data. 
2. [jQuery](http://jquery.com/) is a quintessential JavaScriptIt for manipulating HTML documents.

# Build
1. Check out the [project](https://github.com/indrabasak/patra).
2. Install [Node.js](http://nodejs.org).
3. Install [gulp](http://gulpjs.com) from the project root directory.
```    
    npm install gulp
```
4. Install the library's dependencies:
``` 
    npm install
``` 
5. To build the Javascript library, type:
``` 
    gulp build:js
```     
P.S. If your OS does not recognize gulp, trying installing command line interface of gulp by typing:
``` 
    npm install --global gulp-cli
``` 
6. To build the css library, type
```     
    gulp build:css
```     
7. To build everything at the same time, type
```   
    gulp
``` 
8. To build with Google closure compiler, type
```   
    gulp compile
``` 
9. To unit test, type
```   
    gulp test
``` 
# License

The __HystrixViewer.js__ code is shared under the terms of [Apache License v2.0](https://opensource.org/licenses/Apache-2.0).

[travis-badge]: https://travis-ci.org/indrabasak/hystrix-viewer.svg?branch=master
[travis-badge-url]: https://travis-ci.org/indrabasak/hystrix-viewer

