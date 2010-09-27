__setupPackage__("goog");

// Input 0
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Bootstrap for the Google JS Library (Closure).
 *
 * In uncompiled mode base.js will write out Closure's deps file, unless the
 * global <code>CLOSURE_NO_DEPS</code> is set to true.  This allows projects to
 * include their own deps file(s) from different locations.
 *
 *
 *
 */

/**
 * @define {boolean} Overridden to true by the compiler when --closure_pass
 *     or --mark_as_compiled is specified.
 */
var COMPILED = false;


/**
 * Base namespace for the Closure library.  Checks to see goog is
 * already defined in the current scope before assigning to prevent
 * clobbering if base.js is loaded more than once.
 *
 * @const
 */



/**
 * Reference to the global context.  In most cases this will be 'window'.
 */
goog.global = this;


/**
 * @define {boolean} DEBUG is provided as a convenience so that debugging code
 * that should not be included in a production js_binary can be easily stripped
 * by specifying --define goog.DEBUG=false to the JSCompiler. For example, most
 * toString() methods should be declared inside an "if (goog.DEBUG)" conditional
 * because they are generally used for debugging purposes and it is difficult
 * for the JSCompiler to statically determine whether they are used.
 */
goog.DEBUG = true;


/**
 * @define {string} LOCALE defines the locale being used for compilation. It is
 * used to select locale specific data to be compiled in js binary. BUILD rule
 * can specify this value by "--define goog.LOCALE=<locale_name>" as JSCompiler
 * option.
 *
 * Take into account that the locale code format is important. You should use
 * the canonical Unicode format with hyphen as a delimiter. Language must be
 * lowercase, Language Script - Capitalized, Region - UPPERCASE.
 * There are few examples: pt-BR, en, en-US, sr-Latin-BO, zh-Hans-CN.
 *
 * See more info about locale codes here:
 * http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers
 *
 * For language codes you should use values defined by ISO 693-1. See it here
 * http://www.w3.org/WAI/ER/IG/ert/iso639.htm. There is only one exception from
 * this rule: the Hebrew language. For legacy reasons the old code (iw) should
 * be used instead of the new code (he), see http://wiki/Main/IIISynonyms.
 */
goog.LOCALE = 'en';  // default to en


/**
 * Indicates whether or not we can call 'eval' directly to eval code in the
 * global scope. Set to a Boolean by the first call to goog.globalEval (which
 * empirically tests whether eval works for globals). @see goog.globalEval
 * @type {?boolean}
 * @private
 */
goog.evalWorksForGlobals_ = null;


/**
 * Creates object stubs for a namespace. When present in a file, goog.provide
 * also indicates that the file defines the indicated object. Calls to
 * goog.provide are resolved by the compiler if --closure_pass is set.
 * @param {string} name name of the object that this file defines.
 */
goog.provide = function(name) {
  if (!COMPILED) {
    // Ensure that the same namespace isn't provided twice. This is intended
    // to teach new developers that 'goog.provide' is effectively a variable
    // declaration. And when JSCompiler transforms goog.provide into a real
    // variable declaration, the compiled JS should work the same as the raw
    // JS--even when the raw JS uses goog.provide incorrectly.
    if (goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }

    var namespace = name;
    while ((namespace = namespace.substring(0, namespace.lastIndexOf('.')))) {
      goog.implicitNamespaces_[namespace] = true;
    }
  }

  goog.exportPath_(name);
};


if (!COMPILED) {
  /**
   * Namespaces implicitly defined by goog.provide. For example,
   * goog.provide('goog.events.Event') implicitly declares
   * that 'goog' and 'goog.events' must be namespaces.
   *
   * @type {Object}
   * @private
   */
  goog.implicitNamespaces_ = {};
}


/**
 * Builds an object structure for the provided namespace path,
 * ensuring that names that already exist are not overwritten. For
 * example:
 * "a.b.c" -> a = {};a.b={};a.b.c={};
 * Used by goog.provide and goog.exportSymbol.
 * @param {string} name name of the object that this file defines.
 * @param {*=} opt_object the object to expose at the end of the path.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 * @private
 */
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split('.');
  var cur = opt_objectToExportTo || goog.global;

  // Internet Explorer exhibits strange behavior when throwing errors from
  // methods externed in this manner.  See the testExportSymbolExceptions in
  // base_test.html for an example.
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript('var ' + parts[0]);
  }

  // Certain browsers cannot parse code in the form for((a in b); c;);
  // This pattern is produced by the JSCompiler when it collapses the
  // statement above into the conditional loop below. To prevent this from
  // happening, use a for-loop and reserve the init logic as below.

  // Parentheses added to eliminate strict JS warning in Firefox.
  for (var part; parts.length && (part = parts.shift());) {
    if (!parts.length && goog.isDef(opt_object)) {
      // last part and we have an object; use it
      cur[part] = opt_object;
    } else if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
};


/**
 * Returns an object based on its fully qualified external name.  If you are
 * using a compilation pass that renames property names beware that using this
 * function will not find renamed properties.
 *
 * @param {string} name The fully qualified name.
 * @param {Object=} opt_obj The object within which to look; default is
 *     |goog.global|.
 * @return {Object} The object or, if not found, null.
 */
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split('.');
  var cur = opt_obj || goog.global;
  for (var part; part = parts.shift(); ) {
    if (cur[part]) {
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;
};


/**
 * Globalizes a whole namespace, such as goog or goog.lang.
 *
 * @param {Object} obj The namespace to globalize.
 * @param {Object=} opt_global The object to add the properties to.
 * @deprecated Properties may be explicitly exported to the global scope, but
 *     this should no longer be done in bulk.
 */
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for (var x in obj) {
    global[x] = obj[x];
  }
};


/**
 * Adds a dependency from a file to the files it requires.
 * @param {string} relPath The path to the js file.
 * @param {Array} provides An array of strings with the names of the objects
 *                         this file provides.
 * @param {Array} requires An array of strings with the names of the objects
 *                         this file requires.
 */
goog.addDependency = function(relPath, provides, requires) {
  if (!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, '/');
    var deps = goog.dependencies_;
    for (var i = 0; provide = provides[i]; i++) {
      deps.nameToPath[provide] = path;
      if (!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {};
      }
      deps.pathToNames[path][provide] = true;
    }
    for (var j = 0; require = requires[j]; j++) {
      if (!(path in deps.requires)) {
        deps.requires[path] = {};
      }
      deps.requires[path][require] = true;
    }
  }
};



/**
 * Implements a system for the dynamic resolution of dependencies
 * that works in parallel with the BUILD system. Note that all calls
 * to goog.require will be stripped by the JSCompiler when the
 * --closure_pass option is used.
 * @param {string} rule Rule to include, in the form goog.package.part.
 */
goog.require = function(rule) {

  // if the object already exists we do not need do do anything
  // TODO(user): If we start to support require based on file name this has
  //            to change
  // TODO(user): If we allow goog.foo.* this has to change
  // TODO(user): If we implement dynamic load after page load we should probably
  //            not remove this code for the compiled output
  if (!COMPILED) {
    if (goog.getObjectByName(rule)) {
      return;
    }
    var path = goog.getPathFromDeps_(rule);
    if (path) {
      goog.included_[path] = true;
      goog.writeScripts_();
    } else {
      var errorMessage = 'goog.require could not find: ' + rule;
      if (goog.global.console) {
        goog.global.console['error'](errorMessage);
      }

      
        throw Error(errorMessage);
        
    }
  }
};


/**
 * Path for included scripts
 * @type {string}
 */
goog.basePath = '';


/**
 * A hook for overriding the base path.
 * @type {string|undefined}
 */
goog.global.CLOSURE_BASE_PATH;


/**
 * Whether to write out Closure's deps file. By default,
 * the deps are written.
 * @type {boolean|undefined}
 */
goog.global.CLOSURE_NO_DEPS;


/**
 * Null function used for default values of callbacks, etc.
 * @return {void} Nothing.
 */
goog.nullFunction = function() {};


/**
 * The identity function. Returns its first argument.
 *
 * @param {...*} var_args The arguments of the function.
 * @return {*} The first argument.
 * @deprecated Use goog.functions.identity instead.
 */
goog.identityFunction = function(var_args) {
  return arguments[0];
};


/**
 * When defining a class Foo with an abstract method bar(), you can do:
 *
 * Foo.prototype.bar = goog.abstractMethod
 *
 * Now if a subclass of Foo fails to override bar(), an error
 * will be thrown when bar() is invoked.
 *
 * Note: This does not take the name of the function to override as
 * an argument because that would make it more difficult to obfuscate
 * our JavaScript code.
 *
 * @type {!Function}
 * @throws {Error} when invoked to indicate the method should be
 *   overridden.
 */
goog.abstractMethod = function() {
  throw Error('unimplemented abstract method');
};


/**
 * Adds a {@code getInstance} static method that always return the same instance
 * object.
 * @param {!Function} ctor The constructor for the class to add the static
 *     method to.
 */
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor());
  };
};


if (!COMPILED) {
  /**
   * Object used to keep track of urls that have already been added. This
   * record allows the prevention of circular dependencies.
   * @type {Object}
   * @private
   */
  goog.included_ = {};


  /**
   * This object is used to keep track of dependencies and other data that is
   * used for loading scripts
   * @private
   * @type {Object}
   */
  goog.dependencies_ = {
    pathToNames: {}, // 1 to many
    nameToPath: {}, // 1 to 1
    requires: {}, // 1 to many
    // used when resolving dependencies to prevent us from
    // visiting the file twice
    visited: {},
    written: {} // used to keep track of script files we have written
  };


  /**
   * Tries to detect whether is in the context of an HTML document.
   * @return {boolean} True if it looks like HTML document.
   * @private
   */
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != 'undefined' &&
           'write' in doc;  // XULDocument misses write.
  };


  /**
   * Tries to detect the base path of the base.js script that bootstraps Closure
   * @private
   */
  goog.findBasePath_ = function() {
    if (!goog.inHtmlDocument_()) {
      return;
    }
    var doc = goog.global.document;
    if (goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    }
    var scripts = doc.getElementsByTagName('script');
    // Search backwards since the current script is in almost all cases the one
    // that has base.js.
    for (var i = scripts.length - 1; i >= 0; --i) {
      var src = scripts[i].src;
      var l = src.length;
      if (src.substr(l - 7) == 'base.js') {
        goog.basePath = src.substr(0, l - 7);
        return;
      }
    }
  };


  /**
   * Writes a script tag if, and only if, that script hasn't already been added
   * to the document.  (Must be called at execution time)
   * @param {string} src Script source.
   * @private
   */
  goog.writeScriptTag_ = function(src) {
    if (goog.inHtmlDocument_() &&
        !goog.dependencies_.written[src]) {
      goog.dependencies_.written[src] = true;
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' +
                src + '"></' + 'script>');
    }
  };


  /**
   * Resolves dependencies based on the dependencies added using addDependency
   * and calls writeScriptTag_ in the correct order.
   * @private
   */
  goog.writeScripts_ = function() {
    // the scripts we need to write this time
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;

    function visitNode(path) {
      if (path in deps.written) {
        return;
      }

      // we have already visited this one. We can get here if we have cyclic
      // dependencies
      if (path in deps.visited) {
        if (!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path);
        }
        return;
      }

      deps.visited[path] = true;

      if (path in deps.requires) {
        for (var requireName in deps.requires[path]) {
          if (requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName]);
          } else if (!goog.getObjectByName(requireName)) {
            // If the required name is defined, we assume that this
            // dependency was bootstapped by other means. Otherwise,
            // throw an exception.
            throw Error('Undefined nameToPath for ' + requireName);
          }
        }
      }

      if (!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path);
      }
    }

    for (var path in goog.included_) {
      if (!deps.written[path]) {
        visitNode(path);
      }
    }

    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i]) {
        goog.writeScriptTag_(goog.basePath + scripts[i]);
      } else {
        throw Error('Undefined script input');
      }
    }
  };


  /**
   * Looks at the dependency rules and tries to determine the script file that
   * fulfills a particular rule.
   * @param {string} rule In the form goog.namespace.Class or project.script.
   * @return {?string} Url corresponding to the rule, or null.
   * @private
   */
  goog.getPathFromDeps_ = function(rule) {
    if (rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule];
    } else {
      return null;
    }
  };

  goog.findBasePath_();

  // Allow projects to manage the deps files themselves.
  if (!goog.global.CLOSURE_NO_DEPS) {
    goog.writeScriptTag_(goog.basePath + 'deps.js');
  }
}



//==============================================================================
// Language Enhancements
//==============================================================================


/**
 * This is a "fixed" version of the typeof operator.  It differs from the typeof
 * operator in such a way that null returns 'null' and arrays return 'array'.
 * @param {*} value The value to get the type of.
 * @return {string} The name of the type.
 */
goog.typeOf = function(value) {
  var s = typeof value;
  if (s == 'object') {
    if (value) {
      // We cannot use constructor == Array or instanceof Array because
      // different frames have different Array objects. In IE6, if the iframe
      // where the array was created is destroyed, the array loses its
      // prototype. Then dereferencing val.splice here throws an exception, so
      // we can't use goog.isFunction. Calling typeof directly returns 'unknown'
      // so that will work. In this case, this function will return false and
      // most array functions will still work because the array is still
      // array-like (supports length and []) even though it has lost its
      // prototype.
      // Mark Miller noticed that Object.prototype.toString
      // allows access to the unforgeable [[Class]] property.
      //  15.2.4.2 Object.prototype.toString ( )
      //  When the toString method is called, the following steps are taken:
      //      1. Get the [[Class]] property of this object.
      //      2. Compute a string value by concatenating the three strings
      //         "[object ", Result(1), and "]".
      //      3. Return Result(2).
      // and this behavior survives the destruction of the execution context.
      if (value instanceof Array ||  // Works quickly in same execution context.
          // If value is from a different execution context then
          // !(value instanceof Object), which lets us early out in the common
          // case when value is from the same context but not an array.
          // The {if (value)} check above means we don't have to worry about
          // undefined behavior of Object.prototype.toString on null/undefined.
          //
          // HACK: In order to use an Object prototype method on the arbitrary
          //   value, the compiler requires the value be cast to type Object,
          //   even though the ECMA spec explicitly allows it.
          (!(value instanceof Object) &&
           (Object.prototype.toString.call(
               /** @type {Object} */ (value)) == '[object Array]') ||

           // In IE all non value types are wrapped as objects across window
           // boundaries (not iframe though) so we have to do object detection
           // for this edge case
           typeof value.length == 'number' &&
           typeof value.splice != 'undefined' &&
           typeof value.propertyIsEnumerable != 'undefined' &&
           !value.propertyIsEnumerable('splice')

          )) {
        return 'array';
      }
      // HACK: There is still an array case that fails.
      //     function ArrayImpostor() {}
      //     ArrayImpostor.prototype = [];
      //     var impostor = new ArrayImpostor;
      // this can be fixed by getting rid of the fast path
      // (value instanceof Array) and solely relying on
      // (value && Object.prototype.toString.vall(value) === '[object Array]')
      // but that would require many more function calls and is not warranted
      // unless closure code is receiving objects from untrusted sources.

      // IE in cross-window calls does not correctly marshal the function type
      // (it appears just as an object) so we cannot use just typeof val ==
      // 'function'. However, if the object has a call property, it is a
      // function.
      if (!(value instanceof Object) &&
          (Object.prototype.toString.call(
              /** @type {Object} */ (value)) == '[object Function]' ||
          typeof value.call != 'undefined' &&
          typeof value.propertyIsEnumerable != 'undefined' &&
          !value.propertyIsEnumerable('call'))) {
        return 'function';
      }


    } else {
      return 'null';
    }

  } else if (s == 'function' && typeof value.call == 'undefined') {
    // In Safari typeof nodeList returns 'function', and on Firefox
    // typeof behaves similarly for HTML{Applet,Embed,Object}Elements
    // and RegExps.  We would like to return object for those and we can
    // detect an invalid function by making sure that the function
    // object has a call method.
    return 'object';
  }
  return s;
};


/**
 * Safe way to test whether a property is enumarable.  It allows testing
 * for enumerable on objects where 'propertyIsEnumerable' is overridden or
 * does not exist (like DOM nodes in IE). Does not use browser native
 * Object.propertyIsEnumerable.
 * @param {Object} object The object to test if the property is enumerable.
 * @param {string} propName The property name to check for.
 * @return {boolean} True if the property is enumarable.
 * @private
 */
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  // KJS in Safari 2 is not ECMAScript compatible and lacks crucial methods
  // such as propertyIsEnumerable.  We therefore use a workaround.
  // Does anyone know a more efficient work around?
  if (propName in object) {
    for (var key in object) {
      if (key == propName &&
          Object.prototype.hasOwnProperty.call(object, propName)) {
        return true;
      }
    }
  }
  return false;
};


/**
 * Safe way to test whether a property is enumarable.  It allows testing
 * for enumerable on objects where 'propertyIsEnumerable' is overridden or
 * does not exist (like DOM nodes in IE).
 * @param {Object} object The object to test if the property is enumerable.
 * @param {string} propName The property name to check for.
 * @return {boolean} True if the property is enumarable.
 * @private
 */
goog.propertyIsEnumerable_ = function(object, propName) {
  // In IE if object is from another window, cannot use propertyIsEnumerable
  // from this window's Object. Will raise a 'JScript object expected' error.
  if (object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName);
  } else {
    return goog.propertyIsEnumerableCustom_(object, propName);
  }
};


/**
 * Returns true if the specified value is not |undefined|.
 * WARNING: Do not use this to test if an object has a property. Use the in
 * operator instead.  Additionally, this function assumes that the global
 * undefined variable has not been redefined.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined.
 */
goog.isDef = function(val) {
  return val !== undefined;
};


/**
 * Returns true if the specified value is |null|
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is null.
 */
goog.isNull = function(val) {
  return val === null;
};


/**
 * Returns true if the specified value is defined and not null
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined and not null.
 */
goog.isDefAndNotNull = function(val) {
  // Note that undefined == null.
  return val != null;
};


/**
 * Returns true if the specified value is an array
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArray = function(val) {
  return goog.typeOf(val) == 'array';
};


/**
 * Returns true if the object looks like an array. To qualify as array like
 * the value needs to be either a NodeList or an object with a Number length
 * property.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == 'array' || type == 'object' && typeof val.length == 'number';
};


/**
 * Returns true if the object looks like a Date. To qualify as Date-like
 * the value needs to be an object and have a getFullYear() function.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a like a Date.
 */
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == 'function';
};


/**
 * Returns true if the specified value is a string
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a string.
 */
goog.isString = function(val) {
  return typeof val == 'string';
};


/**
 * Returns true if the specified value is a boolean
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is boolean.
 */
goog.isBoolean = function(val) {
  return typeof val == 'boolean';
};


/**
 * Returns true if the specified value is a number
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a number.
 */
goog.isNumber = function(val) {
  return typeof val == 'number';
};


/**
 * Returns true if the specified value is a function
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a function.
 */
goog.isFunction = function(val) {
  return goog.typeOf(val) == 'function';
};


/**
 * Returns true if the specified value is an object.  This includes arrays
 * and functions.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an object.
 */
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == 'object' || type == 'array' || type == 'function';
};


/**
 * Gets a unique ID for an object. This mutates the object so that further
 * calls with the same object as a parameter returns the same value. The unique
 * ID is guaranteed to be unique across the current session amongst objects that
 * are passed into {@code getUid}. There is no guarantee that the ID is unique
 * or consistent across sessions. It is unsafe to generate unique ID for
 * function prototypes.
 *
 * @param {Object} obj The object to get the unique ID for.
 * @return {number} The unique ID for the object.
 */
goog.getUid = function(obj) {
  // TODO(user): Make the type stricter, do not accept null.

  // In Opera window.hasOwnProperty exists but always returns false so we avoid
  // using it. As a consequence the unique ID generated for BaseClass.prototype
  // and SubClass.prototype will be the same.
  return obj[goog.UID_PROPERTY_] ||
      (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};


/**
 * Removes the unique ID from an object. This is useful if the object was
 * previously mutated using {@code goog.getUid} in which case the mutation is
 * undone.
 * @param {Object} obj The object to remove the unique ID field from.
 */
goog.removeUid = function(obj) {
  // TODO(user): Make the type stricter, do not accept null.

  // DOM nodes in IE are not instance of Object and throws exception
  // for delete. Instead we try to use removeAttribute
  if ('removeAttribute' in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_);
  }
  /** @preserveTry */
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};


/**
 * Name for unique ID property. Initialized in a way to help avoid collisions
 * with other closure javascript on the same page.
 * @type {string}
 * @private
 */
goog.UID_PROPERTY_ = 'closure_uid_' +
    Math.floor(Math.random() * 2147483648).toString(36);


/**
 * Counter for UID.
 * @type {number}
 * @private
 */
goog.uidCounter_ = 0;


/**
 * Adds a hash code field to an object. The hash code is unique for the
 * given object.
 * @param {Object} obj The object to get the hash code for.
 * @return {number} The hash code for the object.
 * @deprecated Use goog.getUid instead.
 */
goog.getHashCode = goog.getUid;


/**
 * Removes the hash code field from an object.
 * @param {Object} obj The object to remove the field from.
 * @deprecated Use goog.removeUid instead.
 */
goog.removeHashCode = goog.removeUid;


/**
 * Clones a value. The input may be an Object, Array, or basic type. Objects and
 * arrays will be cloned recursively.
 *
 * WARNINGS:
 * <code>goog.cloneObject</code> does not detect reference loops. Objects that
 * refer to themselves will cause infinite recursion.
 *
 * <code>goog.cloneObject</code> is unaware of unique identifiers, and copies
 * UIDs created by <code>getUid</code> into cloned results.
 *
 * @param {*} obj The value to clone.
 * @return {*} A clone of the input value.
 * @deprecated goog.cloneObject is unsafe. Prefer the goog.object methods.
 */
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * Forward declaration for the clone method. This is necessary until the
 * compiler can better support duck-typing constructs as used in
 * goog.cloneObject.
 *
 * TODO(user): Remove once the JSCompiler can infer that the check for
 * proto.clone is safe in goog.cloneObject.
 *
 * @type {Function}
 */
Object.prototype.clone;


/**
 * Partially applies this function to a particular 'this object' and zero or
 * more arguments. The result is a new function with some arguments of the first
 * function pre-filled and the value of |this| 'pre-specified'.<br><br>
 *
 * Remaining arguments specified at call-time are appended to the pre-
 * specified ones.<br><br>
 *
 * Also see: {@link #partial}.<br><br>
 *
 * Usage:
 * <pre>var barMethBound = bind(myFunction, myObj, 'arg1', 'arg2');
 * barMethBound('arg3', 'arg4');</pre>
 *
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run. If the value is null or undefined, it
 *     will default to the global object.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 *
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
goog.bind = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;

  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      // Prepend the bound arguments to the current arguments.
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs);
    };

  } else {
    return function() {
      return fn.apply(context, arguments);
    };
  }
};


/**
 * Like bind(), except that a 'this object' is not required. Useful when the
 * target function is already bound.
 *
 * Usage:
 * var g = partial(f, arg1, arg2);
 * g(arg3, arg4);
 *
 * @param {Function} fn A function to partially apply.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to fn.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    // Prepend the bound arguments to the current arguments.
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs);
  };
};


/**
 * Copies all the members of a source object to a target object. This method
 * does not work on all browsers for all objects that contain keys such as
 * toString or hasOwnProperty. Use goog.object.extend for this purpose.
 * @param {Object} target Target.
 * @param {Object} source Source.
 */
goog.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }

  // For IE7 or lower, the for-in-loop does not contain any properties that are
  // not enumerable on the prototype object (for example, isPrototypeOf from
  // Object.prototype) but also it will not include 'replace' on objects that
  // extend String and change 'replace' (not that it is common for anyone to
  // extend anything except Object).
};


/**
 * @return {number} An integer value representing the number of milliseconds
 *     between midnight, January 1, 1970 and the current time.
 */
goog.now = Date.now || (function() {
  // Unary plus operator converts its operand to a number which in the case of
  // a date is done by calling getTime().
  return +new Date();
});


/**
 * Evals javascript in the global scope.  In IE this uses execScript, other
 * browsers use goog.global.eval. If goog.global.eval does not evaluate in the
 * global scope (for example, in Safari), appends a script tag instead.
 * Throws an exception if neither execScript or eval is defined.
 * @param {string} script JavaScript string.
 */
goog.globalEval = function(script) {
  if (goog.global.execScript) {
    goog.global.execScript(script, 'JavaScript');
  } else if (goog.global.eval) {
    // Test to see if eval works
    if (goog.evalWorksForGlobals_ == null) {
      goog.global.eval('var _et_ = 1;');
      if (typeof goog.global['_et_'] != 'undefined') {
        delete goog.global['_et_'];
        goog.evalWorksForGlobals_ = true;
      } else {
        goog.evalWorksForGlobals_ = false;
      }
    }

    if (goog.evalWorksForGlobals_) {
      goog.global.eval(script);
    } else {
      var doc = goog.global.document;
      var scriptElt = doc.createElement('script');
      scriptElt.type = 'text/javascript';
      scriptElt.defer = false;
      // Note(user): can't use .innerHTML since "t('<test>')" will fail and
      // .text doesn't work in Safari 2.  Therefore we append a text node.
      scriptElt.appendChild(doc.createTextNode(script));
      doc.body.appendChild(scriptElt);
      doc.body.removeChild(scriptElt);
    }
  } else {
    throw Error('goog.globalEval not available');
  }
};


/**
 * A macro for defining composite types.
 *
 * By assigning goog.typedef to a name, this tells JSCompiler that this is not
 * the name of a class, but rather it's the name of a composite type.
 *
 * For example,
 * /** @type {Array|NodeList} / goog.ArrayLike = goog.typedef;
 * will tell JSCompiler to replace all appearances of goog.ArrayLike in type
 * definitions with the union of Array and NodeList.
 *
 * Does nothing in uncompiled code.
 *
 * @deprecated Please use the {@code @typedef} annotation.
 */
goog.typedef = true;


/**
 * Optional map of CSS class names to obfuscated names used with
 * goog.getCssName().
 * @type {Object|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMapping_;


/**
 * Handles strings that are intended to be used as CSS class names.
 *
 * Without JS Compiler the arguments are simple joined with a hyphen and passed
 * through unaltered.
 *
 * With the JS Compiler the arguments are inlined, e.g:
 *     var x = goog.getCssName('foo');
 *     var y = goog.getCssName(this.baseClass, 'active');
 *  becomes:
 *     var x= 'foo';
 *     var y = this.baseClass + '-active';
 *
 * If a CSS renaming map is passed to the compiler it will replace symbols in
 * the classname.  If one argument is passed it will be processed, if two are
 * passed only the modifier will be processed, as it is assumed the first
 * argument was generated as a result of calling goog.getCssName.
 *
 * Names are split on 'hyphen' and processed in parts such that the following
 * are equivalent:
 *   var base = goog.getCssName('baseclass');
 *   goog.getCssName(base, 'modifier');
 *   goog.getCSsName('baseclass-modifier');
 *
 * If any part does not appear in the renaming map a warning is logged and the
 * original, unobfuscated class name is inlined.
 *
 * @param {string} className The class name.
 * @param {string=} opt_modifier A modifier to be appended to the class name.
 * @return {string} The class name or the concatenation of the class name and
 *     the modifier.
 */
goog.getCssName = function(className, opt_modifier) {
  var cssName = className + (opt_modifier ? '-' + opt_modifier : '');
  return (goog.cssNameMapping_ && (cssName in goog.cssNameMapping_)) ?
      goog.cssNameMapping_[cssName] : cssName;
};


/**
 * Sets the map to check when returning a value from goog.getCssName(). Example:
 * <pre>
 * goog.setCssNameMapping({
 *   "goog-menu": "a",
 *   "goog-menu-disabled": "a-b",
 *   "CSS_LOGO": "b",
 *   "hidden": "c"
 * });
 *
 * // The following evaluates to: "a a-b".
 * goog.getCssName('goog-menu') + ' ' + goog.getCssName('goog-menu', 'disabled')
 * </pre>
 * When declared as a map of string literals to string literals, the JSCompiler
 * will replace all calls to goog.getCssName() using the supplied map if the
 * --closure_pass flag is set.
 *
 * @param {!Object} mapping A map of strings to strings where keys are possible
 *     arguments to goog.getCssName() and values are the corresponding values
 *     that should be returned.
 */
goog.setCssNameMapping = function(mapping) {
  goog.cssNameMapping_ = mapping;
};


/**
 * Abstract implementation of goog.getMsg for use with localized messages.
 * @param {string} str Translatable string, places holders in the form {$foo}.
 * @param {Object=} opt_values Map of place holder name to value.
 * @return {string} message with placeholders filled.
 */
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for (var key in values) {
    var value = ('' + values[key]).replace(/\$/g, '$$$$');
    str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), value);
  }
  return str;
};


/**
 * Exposes an unobfuscated global namespace path for the given object.
 * Note that fields of the exported object *will* be obfuscated,
 * unless they are exported in turn via this function or
 * goog.exportProperty
 *
 * <p>Also handy for making public items that are defined in anonymous
 * closures.
 *
 * ex. goog.exportSymbol('Foo', Foo);
 *
 * ex. goog.exportSymbol('public.path.Foo.staticFunction',
 *                       Foo.staticFunction);
 *     public.path.Foo.staticFunction();
 *
 * ex. goog.exportSymbol('public.path.Foo.prototype.myMethod',
 *                       Foo.prototype.myMethod);
 *     new public.path.Foo().myMethod();
 *
 * @param {string} publicPath Unobfuscated name to export.
 * @param {*} object Object the name should point to.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 */
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};


/**
 * Exports a property unobfuscated into the object's namespace.
 * ex. goog.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
 * ex. goog.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
 * @param {Object} object Object whose static property is being exported.
 * @param {string} publicName Unobfuscated name to export.
 * @param {*} symbol Object the name should point to.
 */
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 * <pre>
 * function ParentClass(a, b) { }
 * ParentClass.prototype.foo = function(a) { }
 *
 * function ChildClass(a, b, c) {
 *   ParentClass.call(this, a, b);
 * }
 *
 * goog.inherits(ChildClass, ParentClass);
 *
 * var child = new ChildClass('a', 'b', 'see');
 * child.foo(); // works
 * </pre>
 *
 * In addition, a superclass' implementation of a method can be invoked
 * as follows:
 *
 * <pre>
 * ChildClass.prototype.foo = function(a) {
 *   ChildClass.superClass_.foo.call(this, a);
 *   // other code
 * };
 * </pre>
 *
 * @param {Function} childCtor Child class.
 * @param {Function} parentCtor Parent class.
 */
goog.inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  childCtor.prototype.constructor = childCtor;
};


/**
 * Call up to the superclass.
 *
 * If this is called from a constructor, then this calls the superclass
 * contructor with arguments 1-N.
 *
 * If this is called from a prototype method, then you must pass
 * the name of the method as the second argument to this function. If
 * you do not, you will get a runtime error. This calls the superclass'
 * method with arguments 2-N.
 *
 * This function only works if you use goog.inherits to express
 * inheritance relationships between your classes.
 *
 * This function is a compiler primitive. At compile-time, the
 * compiler will do macro expansion to remove a lot of
 * the extra overhead that this function introduces. The compiler
 * will also enforce a lot of the assumptions that this function
 * makes, and treat it as a compiler error if you break them.
 *
 * @param {!Object} me Should always be "this".
 * @param {*=} opt_methodName The method name if calling a super method.
 * @param {...*} var_args The rest of the arguments.
 * @return {*} The return value of the superclass method.
 */
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if (caller.superClass_) {
    // This is a constructor. Call the superclass constructor.
    return caller.superClass_.constructor.apply(
        me, Array.prototype.slice.call(arguments, 1));
  }

  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for (var ctor = me.constructor;
       ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = true;
    } else if (foundCaller) {
      return ctor.prototype[opt_methodName].apply(me, args);
    }
  }

  // If we did not find the caller in the prototype chain,
  // then one of two things happened:
  // 1) The caller is an instance method.
  // 2) This method was not called by the right caller.
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  } else {
    throw Error(
        'goog.base called from a method of one name ' +
        'to a method of a different name');
  }
};


/**
 * Allow for aliasing within scope functions.  This function exists for
 * uncompiled code - in compiled code the calls will be inlined and the
 * aliases applied.  In uncompiled code the function is simply run since the
 * aliases as written are valid JavaScript.
 * @param {function()} fn Function to call.  This function can contain aliases
 *     to namespaces (e.g. "var dom = goog.dom") or classes
 *    (e.g. "var Timer = goog.Timer").
 */
goog.scope = function(fn) {
  fn.call(goog.global);
};




// Input 1
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Number formatting symbols.
 *
 * This file is autogenerated by script:
 * http://go/generate_number_constants.py
 * using the --for_closure flag.
 *
 * Before checkin, this file could have been manually edited. This is
 * to incorporate changes before we could fix CLDR. All manual
 * modification must be documented in this section, and should be
 * removed after those changes land to CLDR.
 */

goog.provide('goog.i18n.NumberFormatSymbols');
goog.provide('goog.i18n.NumberFormatSymbols_aa');
goog.provide('goog.i18n.NumberFormatSymbols_aa_DJ');
goog.provide('goog.i18n.NumberFormatSymbols_aa_ER');
goog.provide('goog.i18n.NumberFormatSymbols_aa_ER_SAAHO');
goog.provide('goog.i18n.NumberFormatSymbols_aa_ET');
goog.provide('goog.i18n.NumberFormatSymbols_af');
goog.provide('goog.i18n.NumberFormatSymbols_af_NA');
goog.provide('goog.i18n.NumberFormatSymbols_af_ZA');
goog.provide('goog.i18n.NumberFormatSymbols_ak');
goog.provide('goog.i18n.NumberFormatSymbols_ak_GH');
goog.provide('goog.i18n.NumberFormatSymbols_am');
goog.provide('goog.i18n.NumberFormatSymbols_am_ET');
goog.provide('goog.i18n.NumberFormatSymbols_ar');
goog.provide('goog.i18n.NumberFormatSymbols_ar_AE');
goog.provide('goog.i18n.NumberFormatSymbols_ar_BH');
goog.provide('goog.i18n.NumberFormatSymbols_ar_DZ');
goog.provide('goog.i18n.NumberFormatSymbols_ar_EG');
goog.provide('goog.i18n.NumberFormatSymbols_ar_IQ');
goog.provide('goog.i18n.NumberFormatSymbols_ar_JO');
goog.provide('goog.i18n.NumberFormatSymbols_ar_KW');
goog.provide('goog.i18n.NumberFormatSymbols_ar_LB');
goog.provide('goog.i18n.NumberFormatSymbols_ar_LY');
goog.provide('goog.i18n.NumberFormatSymbols_ar_MA');
goog.provide('goog.i18n.NumberFormatSymbols_ar_OM');
goog.provide('goog.i18n.NumberFormatSymbols_ar_QA');
goog.provide('goog.i18n.NumberFormatSymbols_ar_SA');
goog.provide('goog.i18n.NumberFormatSymbols_ar_SD');
goog.provide('goog.i18n.NumberFormatSymbols_ar_SY');
goog.provide('goog.i18n.NumberFormatSymbols_ar_TN');
goog.provide('goog.i18n.NumberFormatSymbols_ar_YE');
goog.provide('goog.i18n.NumberFormatSymbols_as');
goog.provide('goog.i18n.NumberFormatSymbols_as_IN');
goog.provide('goog.i18n.NumberFormatSymbols_az');
goog.provide('goog.i18n.NumberFormatSymbols_az_AZ');
goog.provide('goog.i18n.NumberFormatSymbols_az_Cyrl');
goog.provide('goog.i18n.NumberFormatSymbols_az_Cyrl_AZ');
goog.provide('goog.i18n.NumberFormatSymbols_az_Latn');
goog.provide('goog.i18n.NumberFormatSymbols_az_Latn_AZ');
goog.provide('goog.i18n.NumberFormatSymbols_be');
goog.provide('goog.i18n.NumberFormatSymbols_be_BY');
goog.provide('goog.i18n.NumberFormatSymbols_bg');
goog.provide('goog.i18n.NumberFormatSymbols_bg_BG');
goog.provide('goog.i18n.NumberFormatSymbols_bn');
goog.provide('goog.i18n.NumberFormatSymbols_bn_BD');
goog.provide('goog.i18n.NumberFormatSymbols_bn_IN');
goog.provide('goog.i18n.NumberFormatSymbols_bo');
goog.provide('goog.i18n.NumberFormatSymbols_bo_CN');
goog.provide('goog.i18n.NumberFormatSymbols_bo_IN');
goog.provide('goog.i18n.NumberFormatSymbols_bs');
goog.provide('goog.i18n.NumberFormatSymbols_bs_BA');
goog.provide('goog.i18n.NumberFormatSymbols_byn');
goog.provide('goog.i18n.NumberFormatSymbols_byn_ER');
goog.provide('goog.i18n.NumberFormatSymbols_ca');
goog.provide('goog.i18n.NumberFormatSymbols_ca_ES');
goog.provide('goog.i18n.NumberFormatSymbols_cch');
goog.provide('goog.i18n.NumberFormatSymbols_cch_NG');
goog.provide('goog.i18n.NumberFormatSymbols_cop');
goog.provide('goog.i18n.NumberFormatSymbols_cs');
goog.provide('goog.i18n.NumberFormatSymbols_cs_CZ');
goog.provide('goog.i18n.NumberFormatSymbols_cy');
goog.provide('goog.i18n.NumberFormatSymbols_cy_GB');
goog.provide('goog.i18n.NumberFormatSymbols_da');
goog.provide('goog.i18n.NumberFormatSymbols_da_DK');
goog.provide('goog.i18n.NumberFormatSymbols_de');
goog.provide('goog.i18n.NumberFormatSymbols_de_AT');
goog.provide('goog.i18n.NumberFormatSymbols_de_BE');
goog.provide('goog.i18n.NumberFormatSymbols_de_CH');
goog.provide('goog.i18n.NumberFormatSymbols_de_DE');
goog.provide('goog.i18n.NumberFormatSymbols_de_LI');
goog.provide('goog.i18n.NumberFormatSymbols_de_LU');
goog.provide('goog.i18n.NumberFormatSymbols_dv');
goog.provide('goog.i18n.NumberFormatSymbols_dv_MV');
goog.provide('goog.i18n.NumberFormatSymbols_dz');
goog.provide('goog.i18n.NumberFormatSymbols_dz_BT');
goog.provide('goog.i18n.NumberFormatSymbols_ee');
goog.provide('goog.i18n.NumberFormatSymbols_ee_GH');
goog.provide('goog.i18n.NumberFormatSymbols_ee_TG');
goog.provide('goog.i18n.NumberFormatSymbols_el');
goog.provide('goog.i18n.NumberFormatSymbols_el_CY');
goog.provide('goog.i18n.NumberFormatSymbols_el_GR');
goog.provide('goog.i18n.NumberFormatSymbols_el_POLYTON');
goog.provide('goog.i18n.NumberFormatSymbols_en');
goog.provide('goog.i18n.NumberFormatSymbols_en_AS');
goog.provide('goog.i18n.NumberFormatSymbols_en_AU');
goog.provide('goog.i18n.NumberFormatSymbols_en_BE');
goog.provide('goog.i18n.NumberFormatSymbols_en_BW');
goog.provide('goog.i18n.NumberFormatSymbols_en_BZ');
goog.provide('goog.i18n.NumberFormatSymbols_en_CA');
goog.provide('goog.i18n.NumberFormatSymbols_en_Dsrt');
goog.provide('goog.i18n.NumberFormatSymbols_en_Dsrt_US');
goog.provide('goog.i18n.NumberFormatSymbols_en_GB');
goog.provide('goog.i18n.NumberFormatSymbols_en_GU');
goog.provide('goog.i18n.NumberFormatSymbols_en_HK');
goog.provide('goog.i18n.NumberFormatSymbols_en_IE');
goog.provide('goog.i18n.NumberFormatSymbols_en_IN');
goog.provide('goog.i18n.NumberFormatSymbols_en_JM');
goog.provide('goog.i18n.NumberFormatSymbols_en_MH');
goog.provide('goog.i18n.NumberFormatSymbols_en_MP');
goog.provide('goog.i18n.NumberFormatSymbols_en_MT');
goog.provide('goog.i18n.NumberFormatSymbols_en_NA');
goog.provide('goog.i18n.NumberFormatSymbols_en_NZ');
goog.provide('goog.i18n.NumberFormatSymbols_en_PH');
goog.provide('goog.i18n.NumberFormatSymbols_en_PK');
goog.provide('goog.i18n.NumberFormatSymbols_en_SG');
goog.provide('goog.i18n.NumberFormatSymbols_en_Shaw');
goog.provide('goog.i18n.NumberFormatSymbols_en_TT');
goog.provide('goog.i18n.NumberFormatSymbols_en_UM');
goog.provide('goog.i18n.NumberFormatSymbols_en_US');
goog.provide('goog.i18n.NumberFormatSymbols_en_VI');
goog.provide('goog.i18n.NumberFormatSymbols_en_ZA');
goog.provide('goog.i18n.NumberFormatSymbols_en_ZW');
goog.provide('goog.i18n.NumberFormatSymbols_eo');
goog.provide('goog.i18n.NumberFormatSymbols_es');
goog.provide('goog.i18n.NumberFormatSymbols_es_AR');
goog.provide('goog.i18n.NumberFormatSymbols_es_BO');
goog.provide('goog.i18n.NumberFormatSymbols_es_CL');
goog.provide('goog.i18n.NumberFormatSymbols_es_CO');
goog.provide('goog.i18n.NumberFormatSymbols_es_CR');
goog.provide('goog.i18n.NumberFormatSymbols_es_DO');
goog.provide('goog.i18n.NumberFormatSymbols_es_EC');
goog.provide('goog.i18n.NumberFormatSymbols_es_ES');
goog.provide('goog.i18n.NumberFormatSymbols_es_GT');
goog.provide('goog.i18n.NumberFormatSymbols_es_HN');
goog.provide('goog.i18n.NumberFormatSymbols_es_MX');
goog.provide('goog.i18n.NumberFormatSymbols_es_NI');
goog.provide('goog.i18n.NumberFormatSymbols_es_PA');
goog.provide('goog.i18n.NumberFormatSymbols_es_PE');
goog.provide('goog.i18n.NumberFormatSymbols_es_PR');
goog.provide('goog.i18n.NumberFormatSymbols_es_PY');
goog.provide('goog.i18n.NumberFormatSymbols_es_SV');
goog.provide('goog.i18n.NumberFormatSymbols_es_US');
goog.provide('goog.i18n.NumberFormatSymbols_es_UY');
goog.provide('goog.i18n.NumberFormatSymbols_es_VE');
goog.provide('goog.i18n.NumberFormatSymbols_et');
goog.provide('goog.i18n.NumberFormatSymbols_et_EE');
goog.provide('goog.i18n.NumberFormatSymbols_eu');
goog.provide('goog.i18n.NumberFormatSymbols_eu_ES');
goog.provide('goog.i18n.NumberFormatSymbols_fa');
goog.provide('goog.i18n.NumberFormatSymbols_fa_AF');
goog.provide('goog.i18n.NumberFormatSymbols_fa_IR');
goog.provide('goog.i18n.NumberFormatSymbols_fi');
goog.provide('goog.i18n.NumberFormatSymbols_fi_FI');
goog.provide('goog.i18n.NumberFormatSymbols_fil');
goog.provide('goog.i18n.NumberFormatSymbols_fil_PH');
goog.provide('goog.i18n.NumberFormatSymbols_fo');
goog.provide('goog.i18n.NumberFormatSymbols_fo_FO');
goog.provide('goog.i18n.NumberFormatSymbols_fr');
goog.provide('goog.i18n.NumberFormatSymbols_fr_BE');
goog.provide('goog.i18n.NumberFormatSymbols_fr_CA');
goog.provide('goog.i18n.NumberFormatSymbols_fr_CH');
goog.provide('goog.i18n.NumberFormatSymbols_fr_FR');
goog.provide('goog.i18n.NumberFormatSymbols_fr_LU');
goog.provide('goog.i18n.NumberFormatSymbols_fr_MC');
goog.provide('goog.i18n.NumberFormatSymbols_fr_SN');
goog.provide('goog.i18n.NumberFormatSymbols_fur');
goog.provide('goog.i18n.NumberFormatSymbols_fur_IT');
goog.provide('goog.i18n.NumberFormatSymbols_ga');
goog.provide('goog.i18n.NumberFormatSymbols_ga_IE');
goog.provide('goog.i18n.NumberFormatSymbols_gaa');
goog.provide('goog.i18n.NumberFormatSymbols_gaa_GH');
goog.provide('goog.i18n.NumberFormatSymbols_gez');
goog.provide('goog.i18n.NumberFormatSymbols_gez_ER');
goog.provide('goog.i18n.NumberFormatSymbols_gez_ET');
goog.provide('goog.i18n.NumberFormatSymbols_gl');
goog.provide('goog.i18n.NumberFormatSymbols_gl_ES');
goog.provide('goog.i18n.NumberFormatSymbols_gsw');
goog.provide('goog.i18n.NumberFormatSymbols_gsw_CH');
goog.provide('goog.i18n.NumberFormatSymbols_gu');
goog.provide('goog.i18n.NumberFormatSymbols_gu_IN');
goog.provide('goog.i18n.NumberFormatSymbols_gv');
goog.provide('goog.i18n.NumberFormatSymbols_gv_GB');
goog.provide('goog.i18n.NumberFormatSymbols_ha');
goog.provide('goog.i18n.NumberFormatSymbols_ha_Arab');
goog.provide('goog.i18n.NumberFormatSymbols_ha_Arab_NG');
goog.provide('goog.i18n.NumberFormatSymbols_ha_Arab_SD');
goog.provide('goog.i18n.NumberFormatSymbols_ha_GH');
goog.provide('goog.i18n.NumberFormatSymbols_ha_Latn');
goog.provide('goog.i18n.NumberFormatSymbols_ha_Latn_GH');
goog.provide('goog.i18n.NumberFormatSymbols_ha_Latn_NE');
goog.provide('goog.i18n.NumberFormatSymbols_ha_Latn_NG');
goog.provide('goog.i18n.NumberFormatSymbols_ha_NE');
goog.provide('goog.i18n.NumberFormatSymbols_ha_NG');
goog.provide('goog.i18n.NumberFormatSymbols_ha_SD');
goog.provide('goog.i18n.NumberFormatSymbols_haw');
goog.provide('goog.i18n.NumberFormatSymbols_haw_US');
goog.provide('goog.i18n.NumberFormatSymbols_he');
goog.provide('goog.i18n.NumberFormatSymbols_he_IL');
goog.provide('goog.i18n.NumberFormatSymbols_hi');
goog.provide('goog.i18n.NumberFormatSymbols_hi_IN');
goog.provide('goog.i18n.NumberFormatSymbols_hr');
goog.provide('goog.i18n.NumberFormatSymbols_hr_HR');
goog.provide('goog.i18n.NumberFormatSymbols_hu');
goog.provide('goog.i18n.NumberFormatSymbols_hu_HU');
goog.provide('goog.i18n.NumberFormatSymbols_hy');
goog.provide('goog.i18n.NumberFormatSymbols_hy_AM');
goog.provide('goog.i18n.NumberFormatSymbols_ia');
goog.provide('goog.i18n.NumberFormatSymbols_id');
goog.provide('goog.i18n.NumberFormatSymbols_id_ID');
goog.provide('goog.i18n.NumberFormatSymbols_ig');
goog.provide('goog.i18n.NumberFormatSymbols_ig_NG');
goog.provide('goog.i18n.NumberFormatSymbols_ii');
goog.provide('goog.i18n.NumberFormatSymbols_ii_CN');
goog.provide('goog.i18n.NumberFormatSymbols_in');
goog.provide('goog.i18n.NumberFormatSymbols_is');
goog.provide('goog.i18n.NumberFormatSymbols_is_IS');
goog.provide('goog.i18n.NumberFormatSymbols_it');
goog.provide('goog.i18n.NumberFormatSymbols_it_CH');
goog.provide('goog.i18n.NumberFormatSymbols_it_IT');
goog.provide('goog.i18n.NumberFormatSymbols_iu');
goog.provide('goog.i18n.NumberFormatSymbols_iw');
goog.provide('goog.i18n.NumberFormatSymbols_ja');
goog.provide('goog.i18n.NumberFormatSymbols_ja_JP');
goog.provide('goog.i18n.NumberFormatSymbols_ka');
goog.provide('goog.i18n.NumberFormatSymbols_ka_GE');
goog.provide('goog.i18n.NumberFormatSymbols_kaj');
goog.provide('goog.i18n.NumberFormatSymbols_kaj_NG');
goog.provide('goog.i18n.NumberFormatSymbols_kam');
goog.provide('goog.i18n.NumberFormatSymbols_kam_KE');
goog.provide('goog.i18n.NumberFormatSymbols_kcg');
goog.provide('goog.i18n.NumberFormatSymbols_kcg_NG');
goog.provide('goog.i18n.NumberFormatSymbols_kfo');
goog.provide('goog.i18n.NumberFormatSymbols_kfo_CI');
goog.provide('goog.i18n.NumberFormatSymbols_kk');
goog.provide('goog.i18n.NumberFormatSymbols_kk_Cyrl');
goog.provide('goog.i18n.NumberFormatSymbols_kk_Cyrl_KZ');
goog.provide('goog.i18n.NumberFormatSymbols_kk_KZ');
goog.provide('goog.i18n.NumberFormatSymbols_kl');
goog.provide('goog.i18n.NumberFormatSymbols_kl_GL');
goog.provide('goog.i18n.NumberFormatSymbols_km');
goog.provide('goog.i18n.NumberFormatSymbols_km_KH');
goog.provide('goog.i18n.NumberFormatSymbols_kn');
goog.provide('goog.i18n.NumberFormatSymbols_kn_IN');
goog.provide('goog.i18n.NumberFormatSymbols_ko');
goog.provide('goog.i18n.NumberFormatSymbols_ko_KR');
goog.provide('goog.i18n.NumberFormatSymbols_kok');
goog.provide('goog.i18n.NumberFormatSymbols_kok_IN');
goog.provide('goog.i18n.NumberFormatSymbols_kpe');
goog.provide('goog.i18n.NumberFormatSymbols_kpe_GN');
goog.provide('goog.i18n.NumberFormatSymbols_kpe_LR');
goog.provide('goog.i18n.NumberFormatSymbols_ku');
goog.provide('goog.i18n.NumberFormatSymbols_ku_Arab');
goog.provide('goog.i18n.NumberFormatSymbols_ku_Arab_IQ');
goog.provide('goog.i18n.NumberFormatSymbols_ku_Arab_IR');
goog.provide('goog.i18n.NumberFormatSymbols_ku_Arab_SY');
goog.provide('goog.i18n.NumberFormatSymbols_ku_IQ');
goog.provide('goog.i18n.NumberFormatSymbols_ku_IR');
goog.provide('goog.i18n.NumberFormatSymbols_ku_Latn');
goog.provide('goog.i18n.NumberFormatSymbols_ku_Latn_TR');
goog.provide('goog.i18n.NumberFormatSymbols_ku_SY');
goog.provide('goog.i18n.NumberFormatSymbols_ku_TR');
goog.provide('goog.i18n.NumberFormatSymbols_kw');
goog.provide('goog.i18n.NumberFormatSymbols_kw_GB');
goog.provide('goog.i18n.NumberFormatSymbols_ky');
goog.provide('goog.i18n.NumberFormatSymbols_ky_KG');
goog.provide('goog.i18n.NumberFormatSymbols_ln');
goog.provide('goog.i18n.NumberFormatSymbols_ln_CD');
goog.provide('goog.i18n.NumberFormatSymbols_ln_CG');
goog.provide('goog.i18n.NumberFormatSymbols_lo');
goog.provide('goog.i18n.NumberFormatSymbols_lo_LA');
goog.provide('goog.i18n.NumberFormatSymbols_lt');
goog.provide('goog.i18n.NumberFormatSymbols_lt_LT');
goog.provide('goog.i18n.NumberFormatSymbols_lv');
goog.provide('goog.i18n.NumberFormatSymbols_lv_LV');
goog.provide('goog.i18n.NumberFormatSymbols_mk');
goog.provide('goog.i18n.NumberFormatSymbols_mk_MK');
goog.provide('goog.i18n.NumberFormatSymbols_ml');
goog.provide('goog.i18n.NumberFormatSymbols_ml_IN');
goog.provide('goog.i18n.NumberFormatSymbols_mn');
goog.provide('goog.i18n.NumberFormatSymbols_mn_CN');
goog.provide('goog.i18n.NumberFormatSymbols_mn_Cyrl');
goog.provide('goog.i18n.NumberFormatSymbols_mn_Cyrl_MN');
goog.provide('goog.i18n.NumberFormatSymbols_mn_MN');
goog.provide('goog.i18n.NumberFormatSymbols_mn_Mong');
goog.provide('goog.i18n.NumberFormatSymbols_mn_Mong_CN');
goog.provide('goog.i18n.NumberFormatSymbols_mo');
goog.provide('goog.i18n.NumberFormatSymbols_mr');
goog.provide('goog.i18n.NumberFormatSymbols_mr_IN');
goog.provide('goog.i18n.NumberFormatSymbols_ms');
goog.provide('goog.i18n.NumberFormatSymbols_ms_BN');
goog.provide('goog.i18n.NumberFormatSymbols_ms_MY');
goog.provide('goog.i18n.NumberFormatSymbols_mt');
goog.provide('goog.i18n.NumberFormatSymbols_mt_MT');
goog.provide('goog.i18n.NumberFormatSymbols_my');
goog.provide('goog.i18n.NumberFormatSymbols_my_MM');
goog.provide('goog.i18n.NumberFormatSymbols_nb');
goog.provide('goog.i18n.NumberFormatSymbols_nb_NO');
goog.provide('goog.i18n.NumberFormatSymbols_nds');
goog.provide('goog.i18n.NumberFormatSymbols_nds_DE');
goog.provide('goog.i18n.NumberFormatSymbols_ne');
goog.provide('goog.i18n.NumberFormatSymbols_ne_IN');
goog.provide('goog.i18n.NumberFormatSymbols_ne_NP');
goog.provide('goog.i18n.NumberFormatSymbols_nl');
goog.provide('goog.i18n.NumberFormatSymbols_nl_BE');
goog.provide('goog.i18n.NumberFormatSymbols_nl_NL');
goog.provide('goog.i18n.NumberFormatSymbols_nn');
goog.provide('goog.i18n.NumberFormatSymbols_nn_NO');
goog.provide('goog.i18n.NumberFormatSymbols_no');
goog.provide('goog.i18n.NumberFormatSymbols_nr');
goog.provide('goog.i18n.NumberFormatSymbols_nr_ZA');
goog.provide('goog.i18n.NumberFormatSymbols_nso');
goog.provide('goog.i18n.NumberFormatSymbols_nso_ZA');
goog.provide('goog.i18n.NumberFormatSymbols_ny');
goog.provide('goog.i18n.NumberFormatSymbols_ny_MW');
goog.provide('goog.i18n.NumberFormatSymbols_oc');
goog.provide('goog.i18n.NumberFormatSymbols_oc_FR');
goog.provide('goog.i18n.NumberFormatSymbols_om');
goog.provide('goog.i18n.NumberFormatSymbols_om_ET');
goog.provide('goog.i18n.NumberFormatSymbols_om_KE');
goog.provide('goog.i18n.NumberFormatSymbols_or');
goog.provide('goog.i18n.NumberFormatSymbols_or_IN');
goog.provide('goog.i18n.NumberFormatSymbols_pa');
goog.provide('goog.i18n.NumberFormatSymbols_pa_Arab');
goog.provide('goog.i18n.NumberFormatSymbols_pa_Arab_PK');
goog.provide('goog.i18n.NumberFormatSymbols_pa_Guru');
goog.provide('goog.i18n.NumberFormatSymbols_pa_Guru_IN');
goog.provide('goog.i18n.NumberFormatSymbols_pa_IN');
goog.provide('goog.i18n.NumberFormatSymbols_pa_PK');
goog.provide('goog.i18n.NumberFormatSymbols_pl');
goog.provide('goog.i18n.NumberFormatSymbols_pl_PL');
goog.provide('goog.i18n.NumberFormatSymbols_ps');
goog.provide('goog.i18n.NumberFormatSymbols_ps_AF');
goog.provide('goog.i18n.NumberFormatSymbols_pt');
goog.provide('goog.i18n.NumberFormatSymbols_pt_BR');
goog.provide('goog.i18n.NumberFormatSymbols_pt_PT');
goog.provide('goog.i18n.NumberFormatSymbols_ro');
goog.provide('goog.i18n.NumberFormatSymbols_ro_MD');
goog.provide('goog.i18n.NumberFormatSymbols_ro_RO');
goog.provide('goog.i18n.NumberFormatSymbols_ru');
goog.provide('goog.i18n.NumberFormatSymbols_ru_RU');
goog.provide('goog.i18n.NumberFormatSymbols_ru_UA');
goog.provide('goog.i18n.NumberFormatSymbols_rw');
goog.provide('goog.i18n.NumberFormatSymbols_rw_RW');
goog.provide('goog.i18n.NumberFormatSymbols_sa');
goog.provide('goog.i18n.NumberFormatSymbols_sa_IN');
goog.provide('goog.i18n.NumberFormatSymbols_se');
goog.provide('goog.i18n.NumberFormatSymbols_se_FI');
goog.provide('goog.i18n.NumberFormatSymbols_se_NO');
goog.provide('goog.i18n.NumberFormatSymbols_sh');
goog.provide('goog.i18n.NumberFormatSymbols_sh_BA');
goog.provide('goog.i18n.NumberFormatSymbols_sh_CS');
goog.provide('goog.i18n.NumberFormatSymbols_sh_YU');
goog.provide('goog.i18n.NumberFormatSymbols_si');
goog.provide('goog.i18n.NumberFormatSymbols_si_LK');
goog.provide('goog.i18n.NumberFormatSymbols_sid');
goog.provide('goog.i18n.NumberFormatSymbols_sid_ET');
goog.provide('goog.i18n.NumberFormatSymbols_sk');
goog.provide('goog.i18n.NumberFormatSymbols_sk_SK');
goog.provide('goog.i18n.NumberFormatSymbols_sl');
goog.provide('goog.i18n.NumberFormatSymbols_sl_SI');
goog.provide('goog.i18n.NumberFormatSymbols_so');
goog.provide('goog.i18n.NumberFormatSymbols_so_DJ');
goog.provide('goog.i18n.NumberFormatSymbols_so_ET');
goog.provide('goog.i18n.NumberFormatSymbols_so_KE');
goog.provide('goog.i18n.NumberFormatSymbols_so_SO');
goog.provide('goog.i18n.NumberFormatSymbols_sq');
goog.provide('goog.i18n.NumberFormatSymbols_sq_AL');
goog.provide('goog.i18n.NumberFormatSymbols_sr');
goog.provide('goog.i18n.NumberFormatSymbols_sr_BA');
goog.provide('goog.i18n.NumberFormatSymbols_sr_CS');
goog.provide('goog.i18n.NumberFormatSymbols_sr_Cyrl');
goog.provide('goog.i18n.NumberFormatSymbols_sr_Cyrl_BA');
goog.provide('goog.i18n.NumberFormatSymbols_sr_Cyrl_CS');
goog.provide('goog.i18n.NumberFormatSymbols_sr_Cyrl_ME');
goog.provide('goog.i18n.NumberFormatSymbols_sr_Cyrl_RS');
goog.provide('goog.i18n.NumberFormatSymbols_sr_Cyrl_YU');
goog.provide('goog.i18n.NumberFormatSymbols_sr_Latn');
goog.provide('goog.i18n.NumberFormatSymbols_sr_Latn_BA');
goog.provide('goog.i18n.NumberFormatSymbols_sr_Latn_CS');
goog.provide('goog.i18n.NumberFormatSymbols_sr_Latn_ME');
goog.provide('goog.i18n.NumberFormatSymbols_sr_Latn_RS');
goog.provide('goog.i18n.NumberFormatSymbols_sr_Latn_YU');
goog.provide('goog.i18n.NumberFormatSymbols_sr_ME');
goog.provide('goog.i18n.NumberFormatSymbols_sr_RS');
goog.provide('goog.i18n.NumberFormatSymbols_sr_YU');
goog.provide('goog.i18n.NumberFormatSymbols_ss');
goog.provide('goog.i18n.NumberFormatSymbols_ss_SZ');
goog.provide('goog.i18n.NumberFormatSymbols_ss_ZA');
goog.provide('goog.i18n.NumberFormatSymbols_st');
goog.provide('goog.i18n.NumberFormatSymbols_st_LS');
goog.provide('goog.i18n.NumberFormatSymbols_st_ZA');
goog.provide('goog.i18n.NumberFormatSymbols_sv');
goog.provide('goog.i18n.NumberFormatSymbols_sv_FI');
goog.provide('goog.i18n.NumberFormatSymbols_sv_SE');
goog.provide('goog.i18n.NumberFormatSymbols_sw');
goog.provide('goog.i18n.NumberFormatSymbols_sw_KE');
goog.provide('goog.i18n.NumberFormatSymbols_sw_TZ');
goog.provide('goog.i18n.NumberFormatSymbols_syr');
goog.provide('goog.i18n.NumberFormatSymbols_syr_SY');
goog.provide('goog.i18n.NumberFormatSymbols_ta');
goog.provide('goog.i18n.NumberFormatSymbols_ta_IN');
goog.provide('goog.i18n.NumberFormatSymbols_te');
goog.provide('goog.i18n.NumberFormatSymbols_te_IN');
goog.provide('goog.i18n.NumberFormatSymbols_tg');
goog.provide('goog.i18n.NumberFormatSymbols_tg_Cyrl');
goog.provide('goog.i18n.NumberFormatSymbols_tg_Cyrl_TJ');
goog.provide('goog.i18n.NumberFormatSymbols_tg_TJ');
goog.provide('goog.i18n.NumberFormatSymbols_th');
goog.provide('goog.i18n.NumberFormatSymbols_th_TH');
goog.provide('goog.i18n.NumberFormatSymbols_ti');
goog.provide('goog.i18n.NumberFormatSymbols_ti_ER');
goog.provide('goog.i18n.NumberFormatSymbols_ti_ET');
goog.provide('goog.i18n.NumberFormatSymbols_tig');
goog.provide('goog.i18n.NumberFormatSymbols_tig_ER');
goog.provide('goog.i18n.NumberFormatSymbols_tl');
goog.provide('goog.i18n.NumberFormatSymbols_tl_PH');
goog.provide('goog.i18n.NumberFormatSymbols_tn');
goog.provide('goog.i18n.NumberFormatSymbols_tn_ZA');
goog.provide('goog.i18n.NumberFormatSymbols_to');
goog.provide('goog.i18n.NumberFormatSymbols_to_TO');
goog.provide('goog.i18n.NumberFormatSymbols_tr');
goog.provide('goog.i18n.NumberFormatSymbols_tr_TR');
goog.provide('goog.i18n.NumberFormatSymbols_trv');
goog.provide('goog.i18n.NumberFormatSymbols_trv_TW');
goog.provide('goog.i18n.NumberFormatSymbols_ts');
goog.provide('goog.i18n.NumberFormatSymbols_ts_ZA');
goog.provide('goog.i18n.NumberFormatSymbols_tt');
goog.provide('goog.i18n.NumberFormatSymbols_tt_RU');
goog.provide('goog.i18n.NumberFormatSymbols_ug');
goog.provide('goog.i18n.NumberFormatSymbols_ug_Arab');
goog.provide('goog.i18n.NumberFormatSymbols_ug_Arab_CN');
goog.provide('goog.i18n.NumberFormatSymbols_ug_CN');
goog.provide('goog.i18n.NumberFormatSymbols_uk');
goog.provide('goog.i18n.NumberFormatSymbols_uk_UA');
goog.provide('goog.i18n.NumberFormatSymbols_ur');
goog.provide('goog.i18n.NumberFormatSymbols_ur_IN');
goog.provide('goog.i18n.NumberFormatSymbols_ur_PK');
goog.provide('goog.i18n.NumberFormatSymbols_uz');
goog.provide('goog.i18n.NumberFormatSymbols_uz_AF');
goog.provide('goog.i18n.NumberFormatSymbols_uz_Arab');
goog.provide('goog.i18n.NumberFormatSymbols_uz_Arab_AF');
goog.provide('goog.i18n.NumberFormatSymbols_uz_Cyrl');
goog.provide('goog.i18n.NumberFormatSymbols_uz_Cyrl_UZ');
goog.provide('goog.i18n.NumberFormatSymbols_uz_Latn');
goog.provide('goog.i18n.NumberFormatSymbols_uz_Latn_UZ');
goog.provide('goog.i18n.NumberFormatSymbols_uz_UZ');
goog.provide('goog.i18n.NumberFormatSymbols_ve');
goog.provide('goog.i18n.NumberFormatSymbols_ve_ZA');
goog.provide('goog.i18n.NumberFormatSymbols_vi');
goog.provide('goog.i18n.NumberFormatSymbols_vi_VN');
goog.provide('goog.i18n.NumberFormatSymbols_wal');
goog.provide('goog.i18n.NumberFormatSymbols_wal_ET');
goog.provide('goog.i18n.NumberFormatSymbols_wo');
goog.provide('goog.i18n.NumberFormatSymbols_wo_Latn');
goog.provide('goog.i18n.NumberFormatSymbols_wo_Latn_SN');
goog.provide('goog.i18n.NumberFormatSymbols_wo_SN');
goog.provide('goog.i18n.NumberFormatSymbols_xh');
goog.provide('goog.i18n.NumberFormatSymbols_xh_ZA');
goog.provide('goog.i18n.NumberFormatSymbols_yo');
goog.provide('goog.i18n.NumberFormatSymbols_yo_NG');
goog.provide('goog.i18n.NumberFormatSymbols_zh');
goog.provide('goog.i18n.NumberFormatSymbols_zh_CN');
goog.provide('goog.i18n.NumberFormatSymbols_zh_HK');
goog.provide('goog.i18n.NumberFormatSymbols_zh_Hans');
goog.provide('goog.i18n.NumberFormatSymbols_zh_Hans_CN');
goog.provide('goog.i18n.NumberFormatSymbols_zh_Hans_HK');
goog.provide('goog.i18n.NumberFormatSymbols_zh_Hans_MO');
goog.provide('goog.i18n.NumberFormatSymbols_zh_Hans_SG');
goog.provide('goog.i18n.NumberFormatSymbols_zh_Hant');
goog.provide('goog.i18n.NumberFormatSymbols_zh_Hant_HK');
goog.provide('goog.i18n.NumberFormatSymbols_zh_Hant_MO');
goog.provide('goog.i18n.NumberFormatSymbols_zh_Hant_TW');
goog.provide('goog.i18n.NumberFormatSymbols_zh_MO');
goog.provide('goog.i18n.NumberFormatSymbols_zh_SG');
goog.provide('goog.i18n.NumberFormatSymbols_zh_TW');
goog.provide('goog.i18n.NumberFormatSymbols_zu');
goog.provide('goog.i18n.NumberFormatSymbols_zu_ZA');


/**
 * Number formatting symbols for locale aa.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_aa = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'DJF'
};


/**
 * Number formatting symbols for locale aa_DJ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_aa_DJ = goog.i18n.NumberFormatSymbols_aa;


/**
 * Number formatting symbols for locale aa_ER.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_aa_ER = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ERN'
};


/**
 * Number formatting symbols for locale aa_ER_SAAHO.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_aa_ER_SAAHO = goog.i18n.NumberFormatSymbols_aa_ER;


/**
 * Number formatting symbols for locale aa_ET.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_aa_ET = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ETB'
};


/**
 * Number formatting symbols for locale af.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_af = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ZAR'
};


/**
 * Number formatting symbols for locale af_NA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_af_NA = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'ZAR'
};


/**
 * Number formatting symbols for locale af_ZA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_af_ZA = goog.i18n.NumberFormatSymbols_af;


/**
 * Number formatting symbols for locale ak.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ak = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'GHC'
};


/**
 * Number formatting symbols for locale ak_GH.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ak_GH = goog.i18n.NumberFormatSymbols_ak;


/**
 * Number formatting symbols for locale am.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_am = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'ETB'
};


/**
 * Number formatting symbols for locale am_ET.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_am_ET = goog.i18n.NumberFormatSymbols_am;


/**
 * Number formatting symbols for locale ar.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ar = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###;#,##0.###-',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00;\u00A4\u00A0#,##0.00-',
  DEF_CURRENCY_CODE: 'AED'
};


/**
 * Number formatting symbols for locale ar_AE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ar_AE = goog.i18n.NumberFormatSymbols_ar;


/**
 * Number formatting symbols for locale ar_BH.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ar_BH = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###;#,##0.###-',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00;\u00A4\u00A0#,##0.00-',
  DEF_CURRENCY_CODE: 'BHD'
};


/**
 * Number formatting symbols for locale ar_DZ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ar_DZ = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###;#,##0.###-',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00;\u00A4\u00A0#,##0.00-',
  DEF_CURRENCY_CODE: 'DZD'
};


/**
 * Number formatting symbols for locale ar_EG.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ar_EG = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###;#,##0.###-',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00;\u00A4\u00A0#,##0.00-',
  DEF_CURRENCY_CODE: 'EGP'
};


/**
 * Number formatting symbols for locale ar_IQ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ar_IQ = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###;#,##0.###-',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00;\u00A4\u00A0#,##0.00-',
  DEF_CURRENCY_CODE: 'IQD'
};


/**
 * Number formatting symbols for locale ar_JO.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ar_JO = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###;#,##0.###-',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00;\u00A4\u00A0#,##0.00-',
  DEF_CURRENCY_CODE: 'JOD'
};


/**
 * Number formatting symbols for locale ar_KW.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ar_KW = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###;#,##0.###-',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00;\u00A4\u00A0#,##0.00-',
  DEF_CURRENCY_CODE: 'KWD'
};


/**
 * Number formatting symbols for locale ar_LB.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ar_LB = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###;#,##0.###-',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00;\u00A4\u00A0#,##0.00-',
  DEF_CURRENCY_CODE: 'LBP'
};


/**
 * Number formatting symbols for locale ar_LY.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ar_LY = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###;#,##0.###-',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00;\u00A4\u00A0#,##0.00-',
  DEF_CURRENCY_CODE: 'LYD'
};


/**
 * Number formatting symbols for locale ar_MA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ar_MA = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###;#,##0.###-',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00;\u00A4\u00A0#,##0.00-',
  DEF_CURRENCY_CODE: 'MAD'
};


/**
 * Number formatting symbols for locale ar_OM.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ar_OM = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###;#,##0.###-',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00;\u00A4\u00A0#,##0.00-',
  DEF_CURRENCY_CODE: 'OMR'
};


/**
 * Number formatting symbols for locale ar_QA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ar_QA = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#0.###;#0.###-',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#0.00',
  DEF_CURRENCY_CODE: 'QAR'
};


/**
 * Number formatting symbols for locale ar_SA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ar_SA = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#0.###;#0.###-',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#0.00',
  DEF_CURRENCY_CODE: 'SAR'
};


/**
 * Number formatting symbols for locale ar_SD.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ar_SD = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###;#,##0.###-',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00;\u00A4\u00A0#,##0.00-',
  DEF_CURRENCY_CODE: 'SDD'
};


/**
 * Number formatting symbols for locale ar_SY.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ar_SY = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#0.###;#0.###-',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#0.00',
  DEF_CURRENCY_CODE: 'SYP'
};


/**
 * Number formatting symbols for locale ar_TN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ar_TN = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#0.###;#0.###-',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#0.00',
  DEF_CURRENCY_CODE: 'TND'
};


/**
 * Number formatting symbols for locale ar_YE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ar_YE = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#0.###;#0.###-',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#0.00',
  DEF_CURRENCY_CODE: 'YER'
};


/**
 * Number formatting symbols for locale as.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_as = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##,##0.00',
  DEF_CURRENCY_CODE: 'INR'
};


/**
 * Number formatting symbols for locale as_IN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_as_IN = goog.i18n.NumberFormatSymbols_as;


/**
 * Number formatting symbols for locale az.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_az = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'AZN'
};


/**
 * Number formatting symbols for locale az_AZ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_az_AZ = goog.i18n.NumberFormatSymbols_az;


/**
 * Number formatting symbols for locale az_Cyrl.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_az_Cyrl = goog.i18n.NumberFormatSymbols_az;


/**
 * Number formatting symbols for locale az_Cyrl_AZ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_az_Cyrl_AZ = goog.i18n.NumberFormatSymbols_az;


/**
 * Number formatting symbols for locale az_Latn.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_az_Latn = goog.i18n.NumberFormatSymbols_az;


/**
 * Number formatting symbols for locale az_Latn_AZ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_az_Latn_AZ = goog.i18n.NumberFormatSymbols_az;


/**
 * Number formatting symbols for locale be.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_be = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'BYR'
};


/**
 * Number formatting symbols for locale be_BY.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_be_BY = goog.i18n.NumberFormatSymbols_be;


/**
 * Number formatting symbols for locale bg.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_bg = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: '\u041D/\u0427',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'BGN'
};


/**
 * Number formatting symbols for locale bg_BG.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_bg_BG = goog.i18n.NumberFormatSymbols_bg;


/**
 * Number formatting symbols for locale bn.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_bn = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '#,##,##0.00\u00A4;(#,##,##0.00\u00A4)',
  DEF_CURRENCY_CODE: 'BDT'
};


/**
 * Number formatting symbols for locale bn_BD.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_bn_BD = goog.i18n.NumberFormatSymbols_bn;


/**
 * Number formatting symbols for locale bn_IN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_bn_IN = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '#,##,##0.00\u00A4;(#,##,##0.00\u00A4)',
  DEF_CURRENCY_CODE: 'INR'
};


/**
 * Number formatting symbols for locale bo.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_bo = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'CNY'
};


/**
 * Number formatting symbols for locale bo_CN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_bo_CN = goog.i18n.NumberFormatSymbols_bo;


/**
 * Number formatting symbols for locale bo_IN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_bo_IN = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'INR'
};


/**
 * Number formatting symbols for locale bs.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_bs = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'BAM'
};


/**
 * Number formatting symbols for locale bs_BA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_bs_BA = goog.i18n.NumberFormatSymbols_bs;


/**
 * Number formatting symbols for locale byn.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_byn = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ERN'
};


/**
 * Number formatting symbols for locale byn_ER.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_byn_ER = goog.i18n.NumberFormatSymbols_byn;


/**
 * Number formatting symbols for locale ca.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ca = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale ca_ES.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ca_ES = goog.i18n.NumberFormatSymbols_ca;


/**
 * Number formatting symbols for locale cch.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_cch = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'NGN'
};


/**
 * Number formatting symbols for locale cch_NG.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_cch_NG = goog.i18n.NumberFormatSymbols_cch;


/**
 * Number formatting symbols for locale cop.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_cop = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'EGP'
};


/**
 * Number formatting symbols for locale cs.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_cs = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'CZK'
};


/**
 * Number formatting symbols for locale cs_CZ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_cs_CZ = goog.i18n.NumberFormatSymbols_cs;


/**
 * Number formatting symbols for locale cy.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_cy = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'GBP'
};


/**
 * Number formatting symbols for locale cy_GB.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_cy_GB = goog.i18n.NumberFormatSymbols_cy;


/**
 * Number formatting symbols for locale da.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_da = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'DKK'
};


/**
 * Number formatting symbols for locale da_DK.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_da_DK = goog.i18n.NumberFormatSymbols_da;


/**
 * Number formatting symbols for locale de.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_de = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale de_AT.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_de_AT = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale de_BE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_de_BE = goog.i18n.NumberFormatSymbols_de;


/**
 * Number formatting symbols for locale de_CH.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_de_CH = {
  DECIMAL_SEP: '.',
  GROUP_SEP: '\'',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00;\u00A4-#,##0.00',
  DEF_CURRENCY_CODE: 'CHF'
};


/**
 * Number formatting symbols for locale de_DE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_de_DE = goog.i18n.NumberFormatSymbols_de;


/**
 * Number formatting symbols for locale de_LI.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_de_LI = {
  DECIMAL_SEP: '.',
  GROUP_SEP: '\'',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'CHF'
};


/**
 * Number formatting symbols for locale de_LU.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_de_LU = goog.i18n.NumberFormatSymbols_de;


/**
 * Number formatting symbols for locale dv.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_dv = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##,##0.00',
  DEF_CURRENCY_CODE: 'MVR'
};


/**
 * Number formatting symbols for locale dv_MV.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_dv_MV = goog.i18n.NumberFormatSymbols_dv;


/**
 * Number formatting symbols for locale dz.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_dz = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E+00',
  PERCENT_PATTERN: '#,##,##0\u00A0%',
  CURRENCY_PATTERN: '\u00A4#,##,##0.00',
  DEF_CURRENCY_CODE: 'BTN'
};


/**
 * Number formatting symbols for locale dz_BT.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_dz_BT = goog.i18n.NumberFormatSymbols_dz;


/**
 * Number formatting symbols for locale ee.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ee = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'GHC'
};


/**
 * Number formatting symbols for locale ee_GH.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ee_GH = goog.i18n.NumberFormatSymbols_ee;


/**
 * Number formatting symbols for locale ee_TG.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ee_TG = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'XOF'
};


/**
 * Number formatting symbols for locale el.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_el = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'e',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'CYP'
};


/**
 * Number formatting symbols for locale el_CY.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_el_CY = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'e',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'CYP'
};


/**
 * Number formatting symbols for locale el_GR.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_el_GR = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'e',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale el_POLYTON.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_el_POLYTON = goog.i18n.NumberFormatSymbols_el;


/**
 * Number formatting symbols for locale en.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00;(\u00A4#,##0.00)',
  DEF_CURRENCY_CODE: 'USD'
};


/**
 * Number formatting symbols for locale en_AS.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_AS = goog.i18n.NumberFormatSymbols_en;


/**
 * Number formatting symbols for locale en_AU.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_AU = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'AUD'
};


/**
 * Number formatting symbols for locale en_BE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_BE = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale en_BW.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_BW = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'BWP'
};


/**
 * Number formatting symbols for locale en_BZ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_BZ = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'BZD'
};


/**
 * Number formatting symbols for locale en_CA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_CA = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00;(\u00A4#,##0.00)',
  DEF_CURRENCY_CODE: 'CAD'
};


/**
 * Number formatting symbols for locale en_Dsrt.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_Dsrt = goog.i18n.NumberFormatSymbols_en;


/**
 * Number formatting symbols for locale en_Dsrt_US.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_Dsrt_US = goog.i18n.NumberFormatSymbols_en;


/**
 * Number formatting symbols for locale en_GB.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_GB = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'GBP'
};


/**
 * Number formatting symbols for locale en_GU.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_GU = goog.i18n.NumberFormatSymbols_en;


/**
 * Number formatting symbols for locale en_HK.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_HK = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00;(\u00A4#,##0.00)',
  DEF_CURRENCY_CODE: 'HKD'
};


/**
 * Number formatting symbols for locale en_IE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_IE = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale en_IN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_IN = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##,##0.00',
  DEF_CURRENCY_CODE: 'INR'
};


/**
 * Number formatting symbols for locale en_JM.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_JM = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'JMD'
};


/**
 * Number formatting symbols for locale en_MH.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_MH = goog.i18n.NumberFormatSymbols_en;


/**
 * Number formatting symbols for locale en_MP.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_MP = goog.i18n.NumberFormatSymbols_en;


/**
 * Number formatting symbols for locale en_MT.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_MT = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'MTL'
};


/**
 * Number formatting symbols for locale en_NA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_NA = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ZAR'
};


/**
 * Number formatting symbols for locale en_NZ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_NZ = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'NZD'
};


/**
 * Number formatting symbols for locale en_PH.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_PH = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00;(\u00A4#,##0.00)',
  DEF_CURRENCY_CODE: 'PHP'
};


/**
 * Number formatting symbols for locale en_PK.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_PK = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##,##0.00',
  DEF_CURRENCY_CODE: 'PKR'
};


/**
 * Number formatting symbols for locale en_SG.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_SG = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00;(\u00A4#,##0.00)',
  DEF_CURRENCY_CODE: 'SGD'
};


/**
 * Number formatting symbols for locale en_Shaw.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_Shaw = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00;(\u00A4#,##0.00)',
  DEF_CURRENCY_CODE: 'GBP'
};


/**
 * Number formatting symbols for locale en_TT.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_TT = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'TTD'
};


/**
 * Number formatting symbols for locale en_UM.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_UM = goog.i18n.NumberFormatSymbols_en;


/**
 * Number formatting symbols for locale en_US.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_US = goog.i18n.NumberFormatSymbols_en;


/**
 * Number formatting symbols for locale en_VI.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_VI = goog.i18n.NumberFormatSymbols_en;


/**
 * Number formatting symbols for locale en_ZA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_ZA = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ZAR'
};


/**
 * Number formatting symbols for locale en_ZW.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_en_ZW = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ZWD'
};


/**
 * Number formatting symbols for locale eo.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_eo = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'USD'
};


/**
 * Number formatting symbols for locale es.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'ARS'
};


/**
 * Number formatting symbols for locale es_AR.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es_AR = goog.i18n.NumberFormatSymbols_es;


/**
 * Number formatting symbols for locale es_BO.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es_BO = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'BOB'
};


/**
 * Number formatting symbols for locale es_CL.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es_CL = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00;\u00A4-#,##0.00',
  DEF_CURRENCY_CODE: 'CLP'
};


/**
 * Number formatting symbols for locale es_CO.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es_CO = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'COP'
};


/**
 * Number formatting symbols for locale es_CR.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es_CR = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'CRC'
};


/**
 * Number formatting symbols for locale es_DO.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es_DO = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'DOP'
};


/**
 * Number formatting symbols for locale es_EC.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es_EC = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00;\u00A4-#,##0.00',
  DEF_CURRENCY_CODE: 'USD'
};


/**
 * Number formatting symbols for locale es_ES.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es_ES = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale es_GT.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es_GT = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'GTQ'
};


/**
 * Number formatting symbols for locale es_HN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es_HN = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'HNL'
};


/**
 * Number formatting symbols for locale es_MX.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es_MX = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'MXN'
};


/**
 * Number formatting symbols for locale es_NI.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es_NI = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'NIO'
};


/**
 * Number formatting symbols for locale es_PA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es_PA = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'PAB'
};


/**
 * Number formatting symbols for locale es_PE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es_PE = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'PEN'
};


/**
 * Number formatting symbols for locale es_PR.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es_PR = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'USD'
};


/**
 * Number formatting symbols for locale es_PY.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es_PY = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00;\u00A4\u00A0-#,##0.00',
  DEF_CURRENCY_CODE: 'PYG'
};


/**
 * Number formatting symbols for locale es_SV.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es_SV = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'SVC'
};


/**
 * Number formatting symbols for locale es_US.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es_US = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'USD'
};


/**
 * Number formatting symbols for locale es_UY.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es_UY = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00;(\u00A4\u00A0#,##0.00)',
  DEF_CURRENCY_CODE: 'UYU'
};


/**
 * Number formatting symbols for locale es_VE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_es_VE = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00;\u00A4-#,##0.00',
  DEF_CURRENCY_CODE: 'VEB'
};


/**
 * Number formatting symbols for locale et.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_et = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '\u2212',
  EXP_SYMBOL: '\u00D710^',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: '\u00A4\u00A4\u00A4',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EEK'
};


/**
 * Number formatting symbols for locale et_EE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_et_EE = goog.i18n.NumberFormatSymbols_et;


/**
 * Number formatting symbols for locale eu.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_eu = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale eu_ES.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_eu_ES = goog.i18n.NumberFormatSymbols_eu;


/**
 * Number formatting symbols for locale fa.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_fa = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '\u2212',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###;\'\u202A\'-#,##0.###\'\u202C\'',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '\'\u202A\'%#,##0\'\u202C\'',
  CURRENCY_PATTERN:
      '#,##0.00\u00A0\u00A4;\'\u202A\'-#,##0.00\'\u202C\'\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'AFN'
};


/**
 * Number formatting symbols for locale fa_AF.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_fa_AF = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '\u2212',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###;\'\u202A\'-#,##0.###\'\u202C\'',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '\'\u202A\'#,##0%\'\u202C\'',
  CURRENCY_PATTERN:
      '#,##0.00\u00A0\u00A4;\'\u202A\'-#,##0.00\'\u202C\'\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'AFN'
};


/**
 * Number formatting symbols for locale fa_IR.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_fa_IR = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '\u2212',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###;\'\u202A\'-#,##0.###\'\u202C\'',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '\'\u202A\'%#,##0\'\u202C\'',
  CURRENCY_PATTERN:
      '#,##0.00\u00A0\u00A4;\'\u202A\'-#,##0.00\'\u202C\'\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'IRR'
};


/**
 * Number formatting symbols for locale fi.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_fi = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'ep\u00E4luku',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale fi_FI.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_fi_FI = goog.i18n.NumberFormatSymbols_fi;


/**
 * Number formatting symbols for locale fil.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_fil = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'PHP'
};


/**
 * Number formatting symbols for locale fil_PH.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_fil_PH = goog.i18n.NumberFormatSymbols_fil;


/**
 * Number formatting symbols for locale fo.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_fo = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '\u2212',
  EXP_SYMBOL: '\u00D710^',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: '\u00A4\u00A4\u00A4',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00;\u00A4-#,##0.00',
  DEF_CURRENCY_CODE: 'DKK'
};


/**
 * Number formatting symbols for locale fo_FO.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_fo_FO = goog.i18n.NumberFormatSymbols_fo;


/**
 * Number formatting symbols for locale fr.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_fr = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale fr_BE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_fr_BE = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale fr_CA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_fr_CA = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4;(#,##0.00\u00A0\u00A4)',
  DEF_CURRENCY_CODE: 'CAD'
};


/**
 * Number formatting symbols for locale fr_CH.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_fr_CH = {
  DECIMAL_SEP: '.',
  GROUP_SEP: '\'',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00;\u00A4-#,##0.00',
  DEF_CURRENCY_CODE: 'CHF'
};


/**
 * Number formatting symbols for locale fr_FR.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_fr_FR = goog.i18n.NumberFormatSymbols_fr;


/**
 * Number formatting symbols for locale fr_LU.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_fr_LU = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale fr_MC.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_fr_MC = goog.i18n.NumberFormatSymbols_fr;


/**
 * Number formatting symbols for locale fr_SN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_fr_SN = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'XOF'
};


/**
 * Number formatting symbols for locale fur.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_fur = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale fur_IT.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_fur_IT = goog.i18n.NumberFormatSymbols_fur;


/**
 * Number formatting symbols for locale ga.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ga = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale ga_IE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ga_IE = goog.i18n.NumberFormatSymbols_ga;


/**
 * Number formatting symbols for locale gaa.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_gaa = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'GHC'
};


/**
 * Number formatting symbols for locale gaa_GH.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_gaa_GH = goog.i18n.NumberFormatSymbols_gaa;


/**
 * Number formatting symbols for locale gez.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_gez = {
  DECIMAL_SEP: '.',
  GROUP_SEP: '\u12C8',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ERN'
};


/**
 * Number formatting symbols for locale gez_ER.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_gez_ER = goog.i18n.NumberFormatSymbols_gez;


/**
 * Number formatting symbols for locale gez_ET.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_gez_ET = {
  DECIMAL_SEP: '.',
  GROUP_SEP: '\u12C8',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ETB'
};


/**
 * Number formatting symbols for locale gl.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_gl = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale gl_ES.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_gl_ES = goog.i18n.NumberFormatSymbols_gl;


/**
 * Number formatting symbols for locale gsw.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_gsw = {
  DECIMAL_SEP: '.',
  GROUP_SEP: '\u2019',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '\u2212',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'CHF'
};


/**
 * Number formatting symbols for locale gsw_CH.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_gsw_CH = goog.i18n.NumberFormatSymbols_gsw;


/**
 * Number formatting symbols for locale gu.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_gu = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##,##0.00',
  DEF_CURRENCY_CODE: 'INR'
};


/**
 * Number formatting symbols for locale gu_IN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_gu_IN = goog.i18n.NumberFormatSymbols_gu;


/**
 * Number formatting symbols for locale gv.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_gv = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'GBP'
};


/**
 * Number formatting symbols for locale gv_GB.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_gv_GB = goog.i18n.NumberFormatSymbols_gv;


/**
 * Number formatting symbols for locale ha.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ha = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'NGN'
};


/**
 * Number formatting symbols for locale ha_Arab.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ha_Arab = goog.i18n.NumberFormatSymbols_ha;


/**
 * Number formatting symbols for locale ha_Arab_NG.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ha_Arab_NG = goog.i18n.NumberFormatSymbols_ha;


/**
 * Number formatting symbols for locale ha_Arab_SD.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ha_Arab_SD = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'SDD'
};


/**
 * Number formatting symbols for locale ha_GH.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ha_GH = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'GHC'
};


/**
 * Number formatting symbols for locale ha_Latn.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ha_Latn = goog.i18n.NumberFormatSymbols_ha;


/**
 * Number formatting symbols for locale ha_Latn_GH.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ha_Latn_GH = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'GHC'
};


/**
 * Number formatting symbols for locale ha_Latn_NE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ha_Latn_NE = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'XOF'
};


/**
 * Number formatting symbols for locale ha_Latn_NG.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ha_Latn_NG = goog.i18n.NumberFormatSymbols_ha;


/**
 * Number formatting symbols for locale ha_NE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ha_NE = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'XOF'
};


/**
 * Number formatting symbols for locale ha_NG.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ha_NG = goog.i18n.NumberFormatSymbols_ha;


/**
 * Number formatting symbols for locale ha_SD.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ha_SD = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'SDD'
};


/**
 * Number formatting symbols for locale haw.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_haw = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00;(\u00A4#,##0.00)',
  DEF_CURRENCY_CODE: 'USD'
};


/**
 * Number formatting symbols for locale haw_US.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_haw_US = goog.i18n.NumberFormatSymbols_haw;


/**
 * Number formatting symbols for locale he.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_he = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'ILS'
};


/**
 * Number formatting symbols for locale he_IL.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_he_IL = goog.i18n.NumberFormatSymbols_he;


/**
 * Number formatting symbols for locale hi.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_hi = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##,##0.00',
  DEF_CURRENCY_CODE: 'INR'
};


/**
 * Number formatting symbols for locale hi_IN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_hi_IN = goog.i18n.NumberFormatSymbols_hi;


/**
 * Number formatting symbols for locale hr.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_hr = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'HRK'
};


/**
 * Number formatting symbols for locale hr_HR.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_hr_HR = goog.i18n.NumberFormatSymbols_hr;


/**
 * Number formatting symbols for locale hu.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_hu = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'HUF'
};


/**
 * Number formatting symbols for locale hu_HU.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_hu_HU = goog.i18n.NumberFormatSymbols_hu;


/**
 * Number formatting symbols for locale hy.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_hy = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#0%',
  CURRENCY_PATTERN: '#0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'AMD'
};


/**
 * Number formatting symbols for locale hy_AM.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_hy_AM = goog.i18n.NumberFormatSymbols_hy;


/**
 * Number formatting symbols for locale ia.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ia = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'USD'
};


/**
 * Number formatting symbols for locale id.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_id = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'IDR'
};


/**
 * Number formatting symbols for locale id_ID.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_id_ID = goog.i18n.NumberFormatSymbols_id;


/**
 * Number formatting symbols for locale ig.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ig = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'NGN'
};


/**
 * Number formatting symbols for locale ig_NG.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ig_NG = goog.i18n.NumberFormatSymbols_ig;


/**
 * Number formatting symbols for locale ii.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ii = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'CNY'
};


/**
 * Number formatting symbols for locale ii_CN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ii_CN = goog.i18n.NumberFormatSymbols_ii;


/**
 * Number formatting symbols for locale in.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_in = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'IDR'
};


/**
 * Number formatting symbols for locale is.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_is = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '\u2212',
  EXP_SYMBOL: '\u00D710^',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'EiTa',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'ISK'
};


/**
 * Number formatting symbols for locale is_IS.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_is_IS = goog.i18n.NumberFormatSymbols_is;


/**
 * Number formatting symbols for locale it.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_it = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'CHF'
};


/**
 * Number formatting symbols for locale it_CH.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_it_CH = {
  DECIMAL_SEP: '.',
  GROUP_SEP: '\'',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00;\u00A4-#,##0.00',
  DEF_CURRENCY_CODE: 'CHF'
};


/**
 * Number formatting symbols for locale it_IT.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_it_IT = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale iu.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_iu = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'CAD'
};


/**
 * Number formatting symbols for locale iw.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_iw = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'ILS'
};


/**
 * Number formatting symbols for locale ja.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ja = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'JPY'
};


/**
 * Number formatting symbols for locale ja_JP.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ja_JP = goog.i18n.NumberFormatSymbols_ja;


/**
 * Number formatting symbols for locale ka.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ka = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'GEL'
};


/**
 * Number formatting symbols for locale ka_GE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ka_GE = goog.i18n.NumberFormatSymbols_ka;


/**
 * Number formatting symbols for locale kaj.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kaj = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'NGN'
};


/**
 * Number formatting symbols for locale kaj_NG.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kaj_NG = goog.i18n.NumberFormatSymbols_kaj;


/**
 * Number formatting symbols for locale kam.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kam = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'KES'
};


/**
 * Number formatting symbols for locale kam_KE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kam_KE = goog.i18n.NumberFormatSymbols_kam;


/**
 * Number formatting symbols for locale kcg.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kcg = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'NGN'
};


/**
 * Number formatting symbols for locale kcg_NG.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kcg_NG = goog.i18n.NumberFormatSymbols_kcg;


/**
 * Number formatting symbols for locale kfo.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kfo = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'NGN'
};


/**
 * Number formatting symbols for locale kfo_CI.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kfo_CI = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'XOF'
};


/**
 * Number formatting symbols for locale kk.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kk = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'KZT'
};


/**
 * Number formatting symbols for locale kk_Cyrl.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kk_Cyrl = goog.i18n.NumberFormatSymbols_kk;


/**
 * Number formatting symbols for locale kk_Cyrl_KZ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kk_Cyrl_KZ = goog.i18n.NumberFormatSymbols_kk;


/**
 * Number formatting symbols for locale kk_KZ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kk_KZ = goog.i18n.NumberFormatSymbols_kk;


/**
 * Number formatting symbols for locale kl.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kl = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00;\u00A4-#,##0.00',
  DEF_CURRENCY_CODE: 'DKK'
};


/**
 * Number formatting symbols for locale kl_GL.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kl_GL = goog.i18n.NumberFormatSymbols_kl;


/**
 * Number formatting symbols for locale km.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_km = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A4',
  DEF_CURRENCY_CODE: 'KHR'
};


/**
 * Number formatting symbols for locale km_KH.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_km_KH = goog.i18n.NumberFormatSymbols_km;


/**
 * Number formatting symbols for locale kn.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kn = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##,##0.00',
  DEF_CURRENCY_CODE: 'INR'
};


/**
 * Number formatting symbols for locale kn_IN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kn_IN = goog.i18n.NumberFormatSymbols_kn;


/**
 * Number formatting symbols for locale ko.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ko = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'KPW'
};


/**
 * Number formatting symbols for locale ko_KR.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ko_KR = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'KRW'
};


/**
 * Number formatting symbols for locale kok.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kok = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##,##0.00',
  DEF_CURRENCY_CODE: 'INR'
};


/**
 * Number formatting symbols for locale kok_IN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kok_IN = goog.i18n.NumberFormatSymbols_kok;


/**
 * Number formatting symbols for locale kpe.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kpe = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'GNF'
};


/**
 * Number formatting symbols for locale kpe_GN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kpe_GN = goog.i18n.NumberFormatSymbols_kpe;


/**
 * Number formatting symbols for locale kpe_LR.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kpe_LR = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'LRD'
};


/**
 * Number formatting symbols for locale ku.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ku = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'IQD'
};


/**
 * Number formatting symbols for locale ku_Arab.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ku_Arab = goog.i18n.NumberFormatSymbols_ku;


/**
 * Number formatting symbols for locale ku_Arab_IQ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ku_Arab_IQ = goog.i18n.NumberFormatSymbols_ku;


/**
 * Number formatting symbols for locale ku_Arab_IR.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ku_Arab_IR = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'IRR'
};


/**
 * Number formatting symbols for locale ku_Arab_SY.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ku_Arab_SY = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'SYP'
};


/**
 * Number formatting symbols for locale ku_IQ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ku_IQ = goog.i18n.NumberFormatSymbols_ku;


/**
 * Number formatting symbols for locale ku_IR.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ku_IR = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'IRR'
};


/**
 * Number formatting symbols for locale ku_Latn.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ku_Latn = goog.i18n.NumberFormatSymbols_ku;


/**
 * Number formatting symbols for locale ku_Latn_TR.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ku_Latn_TR = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'TRY'
};


/**
 * Number formatting symbols for locale ku_SY.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ku_SY = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'SYP'
};


/**
 * Number formatting symbols for locale ku_TR.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ku_TR = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'TRY'
};


/**
 * Number formatting symbols for locale kw.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kw = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'GBP'
};


/**
 * Number formatting symbols for locale kw_GB.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_kw_GB = goog.i18n.NumberFormatSymbols_kw;


/**
 * Number formatting symbols for locale ky.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ky = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'KGS'
};


/**
 * Number formatting symbols for locale ky_KG.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ky_KG = goog.i18n.NumberFormatSymbols_ky;


/**
 * Number formatting symbols for locale ln.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ln = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'CDF'
};


/**
 * Number formatting symbols for locale ln_CD.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ln_CD = goog.i18n.NumberFormatSymbols_ln;


/**
 * Number formatting symbols for locale ln_CG.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ln_CG = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'XAF'
};


/**
 * Number formatting symbols for locale lo.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_lo = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00;\u00A4-#,##0.00',
  DEF_CURRENCY_CODE: 'LAK'
};


/**
 * Number formatting symbols for locale lo_LA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_lo_LA = goog.i18n.NumberFormatSymbols_lo;


/**
 * Number formatting symbols for locale lt.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_lt = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '\u2212',
  EXP_SYMBOL: '\u00D710^',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: '\u00A4\u00A4\u00A4',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'LTL'
};


/**
 * Number formatting symbols for locale lt_LT.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_lt_LT = goog.i18n.NumberFormatSymbols_lt;


/**
 * Number formatting symbols for locale lv.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_lv = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '\u2212',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'nav\u00A0skaitlis',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'LVL'
};


/**
 * Number formatting symbols for locale lv_LV.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_lv_LV = goog.i18n.NumberFormatSymbols_lv;


/**
 * Number formatting symbols for locale mk.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_mk = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###;(#,##0.###)',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'MKD'
};


/**
 * Number formatting symbols for locale mk_MK.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_mk_MK = goog.i18n.NumberFormatSymbols_mk;


/**
 * Number formatting symbols for locale ml.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ml = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '#,##,##0.00\u00A4',
  DEF_CURRENCY_CODE: 'INR'
};


/**
 * Number formatting symbols for locale ml_IN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ml_IN = goog.i18n.NumberFormatSymbols_ml;


/**
 * Number formatting symbols for locale mn.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_mn = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'MNT'
};


/**
 * Number formatting symbols for locale mn_CN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_mn_CN = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'CNY'
};


/**
 * Number formatting symbols for locale mn_Cyrl.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_mn_Cyrl = goog.i18n.NumberFormatSymbols_mn;


/**
 * Number formatting symbols for locale mn_Cyrl_MN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_mn_Cyrl_MN = goog.i18n.NumberFormatSymbols_mn;


/**
 * Number formatting symbols for locale mn_MN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_mn_MN = goog.i18n.NumberFormatSymbols_mn;


/**
 * Number formatting symbols for locale mn_Mong.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_mn_Mong = goog.i18n.NumberFormatSymbols_mn;


/**
 * Number formatting symbols for locale mn_Mong_CN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_mn_Mong_CN = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'CNY'
};


/**
 * Number formatting symbols for locale mo.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_mo = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'MDL'
};


/**
 * Number formatting symbols for locale mr.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_mr = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##,##0.00',
  DEF_CURRENCY_CODE: 'INR'
};


/**
 * Number formatting symbols for locale mr_IN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_mr_IN = goog.i18n.NumberFormatSymbols_mr;


/**
 * Number formatting symbols for locale ms.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ms = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00;(\u00A4#,##0.00)',
  DEF_CURRENCY_CODE: 'AUD'
};


/**
 * Number formatting symbols for locale ms_BN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ms_BN = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'BND'
};


/**
 * Number formatting symbols for locale ms_MY.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ms_MY = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00;(\u00A4#,##0.00)',
  DEF_CURRENCY_CODE: 'MYR'
};


/**
 * Number formatting symbols for locale mt.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_mt = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'MTL'
};


/**
 * Number formatting symbols for locale mt_MT.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_mt_MT = goog.i18n.NumberFormatSymbols_mt;


/**
 * Number formatting symbols for locale my.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_my = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'MMK'
};


/**
 * Number formatting symbols for locale my_MM.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_my_MM = goog.i18n.NumberFormatSymbols_my;


/**
 * Number formatting symbols for locale nb.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_nb = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'NOK'
};


/**
 * Number formatting symbols for locale nb_NO.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_nb_NO = goog.i18n.NumberFormatSymbols_nb;


/**
 * Number formatting symbols for locale nds.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_nds = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale nds_DE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_nds_DE = goog.i18n.NumberFormatSymbols_nds;


/**
 * Number formatting symbols for locale ne.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ne = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'NPR'
};


/**
 * Number formatting symbols for locale ne_IN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ne_IN = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'INR'
};


/**
 * Number formatting symbols for locale ne_NP.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ne_NP = goog.i18n.NumberFormatSymbols_ne;


/**
 * Number formatting symbols for locale nl.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_nl = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00;\u00A4\u00A0#,##0.00-',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale nl_BE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_nl_BE = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale nl_NL.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_nl_NL = goog.i18n.NumberFormatSymbols_nl;


/**
 * Number formatting symbols for locale nn.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_nn = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '\u2212',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'NOK'
};


/**
 * Number formatting symbols for locale nn_NO.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_nn_NO = goog.i18n.NumberFormatSymbols_nn;


/**
 * Number formatting symbols for locale no.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_no = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'NOK'
};


/**
 * Number formatting symbols for locale nr.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_nr = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ZAR'
};


/**
 * Number formatting symbols for locale nr_ZA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_nr_ZA = goog.i18n.NumberFormatSymbols_nr;


/**
 * Number formatting symbols for locale nso.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_nso = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ZAR'
};


/**
 * Number formatting symbols for locale nso_ZA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_nso_ZA = goog.i18n.NumberFormatSymbols_nso;


/**
 * Number formatting symbols for locale ny.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ny = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'MWK'
};


/**
 * Number formatting symbols for locale ny_MW.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ny_MW = goog.i18n.NumberFormatSymbols_ny;


/**
 * Number formatting symbols for locale oc.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_oc = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale oc_FR.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_oc_FR = goog.i18n.NumberFormatSymbols_oc;


/**
 * Number formatting symbols for locale om.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_om = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ETB'
};


/**
 * Number formatting symbols for locale om_ET.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_om_ET = goog.i18n.NumberFormatSymbols_om;


/**
 * Number formatting symbols for locale om_KE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_om_KE = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'KES'
};


/**
 * Number formatting symbols for locale or.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_or = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##,##0.00',
  DEF_CURRENCY_CODE: 'INR'
};


/**
 * Number formatting symbols for locale or_IN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_or_IN = goog.i18n.NumberFormatSymbols_or;


/**
 * Number formatting symbols for locale pa.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_pa = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##,##0.00',
  DEF_CURRENCY_CODE: 'PKR'
};


/**
 * Number formatting symbols for locale pa_Arab.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_pa_Arab = goog.i18n.NumberFormatSymbols_pa;


/**
 * Number formatting symbols for locale pa_Arab_PK.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_pa_Arab_PK = goog.i18n.NumberFormatSymbols_pa;


/**
 * Number formatting symbols for locale pa_Guru.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_pa_Guru = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##,##0.00',
  DEF_CURRENCY_CODE: 'INR'
};


/**
 * Number formatting symbols for locale pa_Guru_IN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_pa_Guru_IN =
    goog.i18n.NumberFormatSymbols_pa_Guru;


/**
 * Number formatting symbols for locale pa_IN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_pa_IN = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##,##0.00',
  DEF_CURRENCY_CODE: 'INR'
};


/**
 * Number formatting symbols for locale pa_PK.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_pa_PK = goog.i18n.NumberFormatSymbols_pa;


/**
 * Number formatting symbols for locale pl.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_pl = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'PLN'
};


/**
 * Number formatting symbols for locale pl_PL.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_pl_PL = goog.i18n.NumberFormatSymbols_pl;


/**
 * Number formatting symbols for locale ps.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ps = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '\u2212',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'AFN'
};


/**
 * Number formatting symbols for locale ps_AF.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ps_AF = goog.i18n.NumberFormatSymbols_ps;


/**
 * Number formatting symbols for locale pt.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_pt = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00;(\u00A4#,##0.00)',
  DEF_CURRENCY_CODE: 'AOA'
};


/**
 * Number formatting symbols for locale pt_BR.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_pt_BR = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00;(\u00A4#,##0.00)',
  DEF_CURRENCY_CODE: 'BRL'
};


/**
 * Number formatting symbols for locale pt_PT.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_pt_PT = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale ro.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ro = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'MDL'
};


/**
 * Number formatting symbols for locale ro_MD.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ro_MD = goog.i18n.NumberFormatSymbols_ro;


/**
 * Number formatting symbols for locale ro_RO.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ro_RO = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'RON'
};


/**
 * Number formatting symbols for locale ru.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ru = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'BYR'
};


/**
 * Number formatting symbols for locale ru_RU.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ru_RU = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'RUB'
};


/**
 * Number formatting symbols for locale ru_UA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ru_UA = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'UAH'
};


/**
 * Number formatting symbols for locale rw.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_rw = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'RWF'
};


/**
 * Number formatting symbols for locale rw_RW.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_rw_RW = goog.i18n.NumberFormatSymbols_rw;


/**
 * Number formatting symbols for locale sa.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sa = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '\u00A4#,##,##0.00',
  DEF_CURRENCY_CODE: 'INR'
};


/**
 * Number formatting symbols for locale sa_IN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sa_IN = goog.i18n.NumberFormatSymbols_sa;


/**
 * Number formatting symbols for locale se.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_se = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '\u2212',
  EXP_SYMBOL: '\u00D710^',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: '\u00A4\u00A4\u00A4',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale se_FI.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_se_FI = goog.i18n.NumberFormatSymbols_se;


/**
 * Number formatting symbols for locale se_NO.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_se_NO = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '\u2212',
  EXP_SYMBOL: '\u00D710^',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: '\u00A4\u00A4\u00A4',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'NOK'
};


/**
 * Number formatting symbols for locale sh.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sh = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'RSD'
};


/**
 * Number formatting symbols for locale sh_BA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sh_BA = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'BAM'
};


/**
 * Number formatting symbols for locale sh_CS.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sh_CS = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale sh_YU.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sh_YU = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'YUM'
};


/**
 * Number formatting symbols for locale si.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_si = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '\u00A4#,##,##0.00;(\u00A4#,##,##0.00)',
  DEF_CURRENCY_CODE: 'LKR'
};


/**
 * Number formatting symbols for locale si_LK.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_si_LK = goog.i18n.NumberFormatSymbols_si;


/**
 * Number formatting symbols for locale sid.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sid = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ETB'
};


/**
 * Number formatting symbols for locale sid_ET.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sid_ET = goog.i18n.NumberFormatSymbols_sid;


/**
 * Number formatting symbols for locale sk.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sk = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'SKK'
};


/**
 * Number formatting symbols for locale sk_SK.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sk_SK = goog.i18n.NumberFormatSymbols_sk;


/**
 * Number formatting symbols for locale sl.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sl = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'e',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale sl_SI.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sl_SI = goog.i18n.NumberFormatSymbols_sl;


/**
 * Number formatting symbols for locale so.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_so = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'DJF'
};


/**
 * Number formatting symbols for locale so_DJ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_so_DJ = goog.i18n.NumberFormatSymbols_so;


/**
 * Number formatting symbols for locale so_ET.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_so_ET = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ETB'
};


/**
 * Number formatting symbols for locale so_KE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_so_KE = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'KES'
};


/**
 * Number formatting symbols for locale so_SO.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_so_SO = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'SOS'
};


/**
 * Number formatting symbols for locale sq.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sq = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'MKD'
};


/**
 * Number formatting symbols for locale sq_AL.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sq_AL = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ALL'
};


/**
 * Number formatting symbols for locale sr.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sr = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'BAM'
};


/**
 * Number formatting symbols for locale sr_BA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sr_BA = goog.i18n.NumberFormatSymbols_sr;


/**
 * Number formatting symbols for locale sr_CS.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sr_CS = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale sr_Cyrl.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sr_Cyrl = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale sr_Cyrl_BA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sr_Cyrl_BA = goog.i18n.NumberFormatSymbols_sr;


/**
 * Number formatting symbols for locale sr_Cyrl_CS.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sr_Cyrl_CS =
    goog.i18n.NumberFormatSymbols_sr_Cyrl;


/**
 * Number formatting symbols for locale sr_Cyrl_ME.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sr_Cyrl_ME =
    goog.i18n.NumberFormatSymbols_sr_Cyrl;


/**
 * Number formatting symbols for locale sr_Cyrl_RS.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sr_Cyrl_RS = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'USD'
};


/**
 * Number formatting symbols for locale sr_Cyrl_YU.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sr_Cyrl_YU = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'YUM'
};


/**
 * Number formatting symbols for locale sr_Latn.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sr_Latn = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'USD'
};


/**
 * Number formatting symbols for locale sr_Latn_BA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sr_Latn_BA = goog.i18n.NumberFormatSymbols_sr;


/**
 * Number formatting symbols for locale sr_Latn_CS.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sr_Latn_CS = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale sr_Latn_ME.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sr_Latn_ME = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale sr_Latn_RS.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sr_Latn_RS =
    goog.i18n.NumberFormatSymbols_sr_Latn;


/**
 * Number formatting symbols for locale sr_Latn_YU.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sr_Latn_YU = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'YUM'
};


/**
 * Number formatting symbols for locale sr_ME.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sr_ME = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale sr_RS.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sr_RS = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'USD'
};


/**
 * Number formatting symbols for locale sr_YU.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sr_YU = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'YUM'
};


/**
 * Number formatting symbols for locale ss.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ss = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ZAR'
};


/**
 * Number formatting symbols for locale ss_SZ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ss_SZ = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'SZL'
};


/**
 * Number formatting symbols for locale ss_ZA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ss_ZA = goog.i18n.NumberFormatSymbols_ss;


/**
 * Number formatting symbols for locale st.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_st = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ZAR'
};


/**
 * Number formatting symbols for locale st_LS.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_st_LS = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'LSL'
};


/**
 * Number formatting symbols for locale st_ZA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_st_ZA = goog.i18n.NumberFormatSymbols_st;


/**
 * Number formatting symbols for locale sv.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sv = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '\u2212',
  EXP_SYMBOL: '\u00D710^',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: '\u00A4\u00A4\u00A4',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'EUR'
};


/**
 * Number formatting symbols for locale sv_FI.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sv_FI = goog.i18n.NumberFormatSymbols_sv;


/**
 * Number formatting symbols for locale sv_SE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sv_SE = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '\u2212',
  EXP_SYMBOL: '\u00D710^',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: '\u00A4\u00A4\u00A4',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0\u00A0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'SEK'
};


/**
 * Number formatting symbols for locale sw.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sw = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'KES'
};


/**
 * Number formatting symbols for locale sw_KE.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sw_KE = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'KES'
};


/**
 * Number formatting symbols for locale sw_TZ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_sw_TZ = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'TZS'
};


/**
 * Number formatting symbols for locale syr.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_syr = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###;#,##0.###-',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00;\u00A4\u00A0#,##0.00-',
  DEF_CURRENCY_CODE: 'SYP'
};


/**
 * Number formatting symbols for locale syr_SY.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_syr_SY = goog.i18n.NumberFormatSymbols_syr;


/**
 * Number formatting symbols for locale ta.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ta = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##,##0.00',
  DEF_CURRENCY_CODE: 'INR'
};


/**
 * Number formatting symbols for locale ta_IN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ta_IN = goog.i18n.NumberFormatSymbols_ta;


/**
 * Number formatting symbols for locale te.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_te = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##,##0.00',
  DEF_CURRENCY_CODE: 'INR'
};


/**
 * Number formatting symbols for locale te_IN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_te_IN = goog.i18n.NumberFormatSymbols_te;


/**
 * Number formatting symbols for locale tg.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_tg = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'TJS'
};


/**
 * Number formatting symbols for locale tg_Cyrl.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_tg_Cyrl = goog.i18n.NumberFormatSymbols_tg;


/**
 * Number formatting symbols for locale tg_Cyrl_TJ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_tg_Cyrl_TJ = goog.i18n.NumberFormatSymbols_tg;


/**
 * Number formatting symbols for locale tg_TJ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_tg_TJ = goog.i18n.NumberFormatSymbols_tg;


/**
 * Number formatting symbols for locale th.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_th = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00;\u00A4-#,##0.00',
  DEF_CURRENCY_CODE: 'THB'
};


/**
 * Number formatting symbols for locale th_TH.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_th_TH = goog.i18n.NumberFormatSymbols_th;


/**
 * Number formatting symbols for locale ti.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ti = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ERN'
};


/**
 * Number formatting symbols for locale ti_ER.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ti_ER = goog.i18n.NumberFormatSymbols_ti;


/**
 * Number formatting symbols for locale ti_ET.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ti_ET = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ETB'
};


/**
 * Number formatting symbols for locale tig.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_tig = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ERN'
};


/**
 * Number formatting symbols for locale tig_ER.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_tig_ER = goog.i18n.NumberFormatSymbols_tig;


/**
 * Number formatting symbols for locale tl.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_tl = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'PHP'
};


/**
 * Number formatting symbols for locale tl_PH.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_tl_PH = goog.i18n.NumberFormatSymbols_tl;


/**
 * Number formatting symbols for locale tn.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_tn = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'BWP'
};


/**
 * Number formatting symbols for locale tn_ZA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_tn_ZA = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ZAR'
};


/**
 * Number formatting symbols for locale to.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_to = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'TOP'
};


/**
 * Number formatting symbols for locale to_TO.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_to_TO = goog.i18n.NumberFormatSymbols_to;


/**
 * Number formatting symbols for locale tr.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_tr = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '%\u00A0#,##0',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'CYP'
};


/**
 * Number formatting symbols for locale tr_TR.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_tr_TR = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '%\u00A0#,##0',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'TRY'
};


/**
 * Number formatting symbols for locale trv.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_trv = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'TWD'
};


/**
 * Number formatting symbols for locale trv_TW.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_trv_TW = goog.i18n.NumberFormatSymbols_trv;


/**
 * Number formatting symbols for locale ts.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ts = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ZAR'
};


/**
 * Number formatting symbols for locale ts_ZA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ts_ZA = goog.i18n.NumberFormatSymbols_ts;


/**
 * Number formatting symbols for locale tt.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_tt = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A4',
  DEF_CURRENCY_CODE: 'RUB'
};


/**
 * Number formatting symbols for locale tt_RU.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_tt_RU = goog.i18n.NumberFormatSymbols_tt;


/**
 * Number formatting symbols for locale ug.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ug = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'CNY'
};


/**
 * Number formatting symbols for locale ug_Arab.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ug_Arab = goog.i18n.NumberFormatSymbols_ug;


/**
 * Number formatting symbols for locale ug_Arab_CN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ug_Arab_CN = goog.i18n.NumberFormatSymbols_ug;


/**
 * Number formatting symbols for locale ug_CN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ug_CN = goog.i18n.NumberFormatSymbols_ug;


/**
 * Number formatting symbols for locale uk.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_uk = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'UAH'
};


/**
 * Number formatting symbols for locale uk_UA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_uk_UA = goog.i18n.NumberFormatSymbols_uk;


/**
 * Number formatting symbols for locale ur.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ur = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'INR'
};


/**
 * Number formatting symbols for locale ur_IN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ur_IN = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##,##0.00',
  DEF_CURRENCY_CODE: 'INR'
};


/**
 * Number formatting symbols for locale ur_PK.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ur_PK = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'PKR'
};


/**
 * Number formatting symbols for locale uz.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_uz = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'AFN'
};


/**
 * Number formatting symbols for locale uz_AF.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_uz_AF = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '\u2212',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'AFN'
};


/**
 * Number formatting symbols for locale uz_Arab.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_uz_Arab = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '\u2212',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'AFN'
};


/**
 * Number formatting symbols for locale uz_Arab_AF.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_uz_Arab_AF =
    goog.i18n.NumberFormatSymbols_uz_Arab;


/**
 * Number formatting symbols for locale uz_Cyrl.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_uz_Cyrl = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'UZS'
};


/**
 * Number formatting symbols for locale uz_Cyrl_UZ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_uz_Cyrl_UZ =
    goog.i18n.NumberFormatSymbols_uz_Cyrl;


/**
 * Number formatting symbols for locale uz_Latn.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_uz_Latn = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'UZS'
};


/**
 * Number formatting symbols for locale uz_Latn_UZ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_uz_Latn_UZ =
    goog.i18n.NumberFormatSymbols_uz_Latn;


/**
 * Number formatting symbols for locale uz_UZ.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_uz_UZ = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'UZS'
};


/**
 * Number formatting symbols for locale ve.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ve = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ZAR'
};


/**
 * Number formatting symbols for locale ve_ZA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_ve_ZA = goog.i18n.NumberFormatSymbols_ve;


/**
 * Number formatting symbols for locale vi.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_vi = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '.',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '#,##0.00\u00A0\u00A4',
  DEF_CURRENCY_CODE: 'VND'
};


/**
 * Number formatting symbols for locale vi_VN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_vi_VN = goog.i18n.NumberFormatSymbols_vi;


/**
 * Number formatting symbols for locale wal.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_wal = {
  DECIMAL_SEP: '.',
  GROUP_SEP: '\u2019',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ETB'
};


/**
 * Number formatting symbols for locale wal_ET.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_wal_ET = goog.i18n.NumberFormatSymbols_wal;


/**
 * Number formatting symbols for locale wo.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_wo = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'XOF'
};


/**
 * Number formatting symbols for locale wo_Latn.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_wo_Latn = goog.i18n.NumberFormatSymbols_wo;


/**
 * Number formatting symbols for locale wo_Latn_SN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_wo_Latn_SN = goog.i18n.NumberFormatSymbols_wo;


/**
 * Number formatting symbols for locale wo_SN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_wo_SN = goog.i18n.NumberFormatSymbols_wo;


/**
 * Number formatting symbols for locale xh.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_xh = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ZAR'
};


/**
 * Number formatting symbols for locale xh_ZA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_xh_ZA = goog.i18n.NumberFormatSymbols_xh;


/**
 * Number formatting symbols for locale yo.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_yo = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4\u00A0#,##0.00',
  DEF_CURRENCY_CODE: 'NGN'
};


/**
 * Number formatting symbols for locale yo_NG.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_yo_NG = goog.i18n.NumberFormatSymbols_yo;


/**
 * Number formatting symbols for locale zh.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_zh = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'CNY'
};


/**
 * Number formatting symbols for locale zh_CN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_zh_CN = goog.i18n.NumberFormatSymbols_zh;


/**
 * Number formatting symbols for locale zh_HK.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_zh_HK = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00;(\u00A4#,##0.00)',
  DEF_CURRENCY_CODE: 'HKD'
};


/**
 * Number formatting symbols for locale zh_Hans.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_zh_Hans = goog.i18n.NumberFormatSymbols_zh;


/**
 * Number formatting symbols for locale zh_Hans_CN.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_zh_Hans_CN = goog.i18n.NumberFormatSymbols_zh;


/**
 * Number formatting symbols for locale zh_Hans_HK.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_zh_Hans_HK = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'HKD'
};


/**
 * Number formatting symbols for locale zh_Hans_MO.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_zh_Hans_MO = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'MOP'
};


/**
 * Number formatting symbols for locale zh_Hans_SG.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_zh_Hans_SG = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'SGD'
};


/**
 * Number formatting symbols for locale zh_Hant.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_zh_Hant = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'TWD'
};


/**
 * Number formatting symbols for locale zh_Hant_HK.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_zh_Hant_HK = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00;(\u00A4#,##0.00)',
  DEF_CURRENCY_CODE: 'HKD'
};


/**
 * Number formatting symbols for locale zh_Hant_MO.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_zh_Hant_MO = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'MOP'
};


/**
 * Number formatting symbols for locale zh_Hant_TW.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_zh_Hant_TW =
    goog.i18n.NumberFormatSymbols_zh_Hant;


/**
 * Number formatting symbols for locale zh_MO.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_zh_MO = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'MOP'
};


/**
 * Number formatting symbols for locale zh_SG.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_zh_SG = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'SGD'
};


/**
 * Number formatting symbols for locale zh_TW.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_zh_TW = {
  DECIMAL_SEP: '.',
  GROUP_SEP: ',',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'TWD'
};


/**
 * Number formatting symbols for locale zu.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_zu = {
  DECIMAL_SEP: ',',
  GROUP_SEP: '\u00A0',
  PERCENT: '%',
  ZERO_DIGIT: '0',
  PLUS_SIGN: '+',
  MINUS_SIGN: '-',
  EXP_SYMBOL: 'E',
  PERMILL: '\u2030',
  INFINITY: '\u221E',
  NAN: 'NaN',
  DECIMAL_PATTERN: '#,##0.###',
  SCIENTIFIC_PATTERN: '#E0',
  PERCENT_PATTERN: '#,##0%',
  CURRENCY_PATTERN: '\u00A4#,##0.00',
  DEF_CURRENCY_CODE: 'ZAR'
};


/**
 * Number formatting symbols for locale zu_ZA.
 * @enum {string}
 */
goog.i18n.NumberFormatSymbols_zu_ZA = goog.i18n.NumberFormatSymbols_zu;


/**
 * Selected number formatting symbols by locale.
 */
goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en;

if (goog.LOCALE == 'aa') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_aa;
}

if (goog.LOCALE == 'aa_DJ' || goog.LOCALE == 'aa-DJ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_aa;
}

if (goog.LOCALE == 'aa_ER' || goog.LOCALE == 'aa-ER') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_aa_ER;
}

if (goog.LOCALE == 'aa_ER_SAAHO' || goog.LOCALE == 'aa-ER-SAAHO') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_aa_ER;
}

if (goog.LOCALE == 'aa_ET' || goog.LOCALE == 'aa-ET') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_aa_ET;
}

if (goog.LOCALE == 'af') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_af;
}

if (goog.LOCALE == 'af_NA' || goog.LOCALE == 'af-NA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_af_NA;
}

if (goog.LOCALE == 'af_ZA' || goog.LOCALE == 'af-ZA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_af;
}

if (goog.LOCALE == 'ak') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ak;
}

if (goog.LOCALE == 'ak_GH' || goog.LOCALE == 'ak-GH') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ak;
}

if (goog.LOCALE == 'am') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_am;
}

if (goog.LOCALE == 'am_ET' || goog.LOCALE == 'am-ET') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_am;
}

if (goog.LOCALE == 'ar') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ar;
}

if (goog.LOCALE == 'ar_AE' || goog.LOCALE == 'ar-AE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ar;
}

if (goog.LOCALE == 'ar_BH' || goog.LOCALE == 'ar-BH') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ar_BH;
}

if (goog.LOCALE == 'ar_DZ' || goog.LOCALE == 'ar-DZ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ar_DZ;
}

if (goog.LOCALE == 'ar_EG' || goog.LOCALE == 'ar-EG') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ar_EG;
}

if (goog.LOCALE == 'ar_IQ' || goog.LOCALE == 'ar-IQ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ar_IQ;
}

if (goog.LOCALE == 'ar_JO' || goog.LOCALE == 'ar-JO') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ar_JO;
}

if (goog.LOCALE == 'ar_KW' || goog.LOCALE == 'ar-KW') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ar_KW;
}

if (goog.LOCALE == 'ar_LB' || goog.LOCALE == 'ar-LB') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ar_LB;
}

if (goog.LOCALE == 'ar_LY' || goog.LOCALE == 'ar-LY') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ar_LY;
}

if (goog.LOCALE == 'ar_MA' || goog.LOCALE == 'ar-MA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ar_MA;
}

if (goog.LOCALE == 'ar_OM' || goog.LOCALE == 'ar-OM') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ar_OM;
}

if (goog.LOCALE == 'ar_QA' || goog.LOCALE == 'ar-QA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ar_QA;
}

if (goog.LOCALE == 'ar_SA' || goog.LOCALE == 'ar-SA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ar_SA;
}

if (goog.LOCALE == 'ar_SD' || goog.LOCALE == 'ar-SD') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ar_SD;
}

if (goog.LOCALE == 'ar_SY' || goog.LOCALE == 'ar-SY') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ar_SY;
}

if (goog.LOCALE == 'ar_TN' || goog.LOCALE == 'ar-TN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ar_TN;
}

if (goog.LOCALE == 'ar_YE' || goog.LOCALE == 'ar-YE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ar_YE;
}

if (goog.LOCALE == 'as') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_as;
}

if (goog.LOCALE == 'as_IN' || goog.LOCALE == 'as-IN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_as;
}

if (goog.LOCALE == 'az') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_az;
}

if (goog.LOCALE == 'az_AZ' || goog.LOCALE == 'az-AZ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_az;
}

if (goog.LOCALE == 'az_Cyrl' || goog.LOCALE == 'az-Cyrl') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_az;
}

if (goog.LOCALE == 'az_Cyrl_AZ' || goog.LOCALE == 'az-Cyrl-AZ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_az;
}

if (goog.LOCALE == 'az_Latn' || goog.LOCALE == 'az-Latn') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_az;
}

if (goog.LOCALE == 'az_Latn_AZ' || goog.LOCALE == 'az-Latn-AZ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_az;
}

if (goog.LOCALE == 'be') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_be;
}

if (goog.LOCALE == 'be_BY' || goog.LOCALE == 'be-BY') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_be;
}

if (goog.LOCALE == 'bg') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_bg;
}

if (goog.LOCALE == 'bg_BG' || goog.LOCALE == 'bg-BG') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_bg;
}

if (goog.LOCALE == 'bn') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_bn;
}

if (goog.LOCALE == 'bn_BD' || goog.LOCALE == 'bn-BD') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_bn;
}

if (goog.LOCALE == 'bn_IN' || goog.LOCALE == 'bn-IN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_bn_IN;
}

if (goog.LOCALE == 'bo') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_bo;
}

if (goog.LOCALE == 'bo_CN' || goog.LOCALE == 'bo-CN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_bo;
}

if (goog.LOCALE == 'bo_IN' || goog.LOCALE == 'bo-IN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_bo_IN;
}

if (goog.LOCALE == 'bs') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_bs;
}

if (goog.LOCALE == 'bs_BA' || goog.LOCALE == 'bs-BA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_bs;
}

if (goog.LOCALE == 'byn') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_byn;
}

if (goog.LOCALE == 'byn_ER' || goog.LOCALE == 'byn-ER') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_byn;
}

if (goog.LOCALE == 'ca') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ca;
}

if (goog.LOCALE == 'ca_ES' || goog.LOCALE == 'ca-ES') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ca;
}

if (goog.LOCALE == 'cch') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_cch;
}

if (goog.LOCALE == 'cch_NG' || goog.LOCALE == 'cch-NG') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_cch;
}

if (goog.LOCALE == 'cop') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_cop;
}

if (goog.LOCALE == 'cs') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_cs;
}

if (goog.LOCALE == 'cs_CZ' || goog.LOCALE == 'cs-CZ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_cs;
}

if (goog.LOCALE == 'cy') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_cy;
}

if (goog.LOCALE == 'cy_GB' || goog.LOCALE == 'cy-GB') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_cy;
}

if (goog.LOCALE == 'da') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_da;
}

if (goog.LOCALE == 'da_DK' || goog.LOCALE == 'da-DK') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_da;
}

if (goog.LOCALE == 'de') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_de;
}

if (goog.LOCALE == 'de_AT' || goog.LOCALE == 'de-AT') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_de_AT;
}

if (goog.LOCALE == 'de_BE' || goog.LOCALE == 'de-BE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_de;
}

if (goog.LOCALE == 'de_CH' || goog.LOCALE == 'de-CH') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_de_CH;
}

if (goog.LOCALE == 'de_DE' || goog.LOCALE == 'de-DE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_de;
}

if (goog.LOCALE == 'de_LI' || goog.LOCALE == 'de-LI') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_de_LI;
}

if (goog.LOCALE == 'de_LU' || goog.LOCALE == 'de-LU') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_de;
}

if (goog.LOCALE == 'dv') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_dv;
}

if (goog.LOCALE == 'dv_MV' || goog.LOCALE == 'dv-MV') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_dv;
}

if (goog.LOCALE == 'dz') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_dz;
}

if (goog.LOCALE == 'dz_BT' || goog.LOCALE == 'dz-BT') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_dz;
}

if (goog.LOCALE == 'ee') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ee;
}

if (goog.LOCALE == 'ee_GH' || goog.LOCALE == 'ee-GH') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ee;
}

if (goog.LOCALE == 'ee_TG' || goog.LOCALE == 'ee-TG') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ee_TG;
}

if (goog.LOCALE == 'el') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_el;
}

if (goog.LOCALE == 'el_CY' || goog.LOCALE == 'el-CY') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_el_CY;
}

if (goog.LOCALE == 'el_GR' || goog.LOCALE == 'el-GR') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_el_GR;
}

if (goog.LOCALE == 'el_POLYTON' || goog.LOCALE == 'el-POLYTON') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_el;
}

if (goog.LOCALE == 'en') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en;
}

if (goog.LOCALE == 'en_AS' || goog.LOCALE == 'en-AS') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en;
}

if (goog.LOCALE == 'en_AU' || goog.LOCALE == 'en-AU') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en_AU;
}

if (goog.LOCALE == 'en_BE' || goog.LOCALE == 'en-BE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en_BE;
}

if (goog.LOCALE == 'en_BW' || goog.LOCALE == 'en-BW') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en_BW;
}

if (goog.LOCALE == 'en_BZ' || goog.LOCALE == 'en-BZ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en_BZ;
}

if (goog.LOCALE == 'en_CA' || goog.LOCALE == 'en-CA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en_CA;
}

if (goog.LOCALE == 'en_Dsrt' || goog.LOCALE == 'en-Dsrt') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en;
}

if (goog.LOCALE == 'en_Dsrt_US' || goog.LOCALE == 'en-Dsrt-US') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en;
}

if (goog.LOCALE == 'en_GB' || goog.LOCALE == 'en-GB') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en_GB;
}

if (goog.LOCALE == 'en_GU' || goog.LOCALE == 'en-GU') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en;
}

if (goog.LOCALE == 'en_HK' || goog.LOCALE == 'en-HK') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en_HK;
}

if (goog.LOCALE == 'en_IE' || goog.LOCALE == 'en-IE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en_IE;
}

if (goog.LOCALE == 'en_IN' || goog.LOCALE == 'en-IN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en_IN;
}

if (goog.LOCALE == 'en_JM' || goog.LOCALE == 'en-JM') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en_JM;
}

if (goog.LOCALE == 'en_MH' || goog.LOCALE == 'en-MH') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en;
}

if (goog.LOCALE == 'en_MP' || goog.LOCALE == 'en-MP') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en;
}

if (goog.LOCALE == 'en_MT' || goog.LOCALE == 'en-MT') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en_MT;
}

if (goog.LOCALE == 'en_NA' || goog.LOCALE == 'en-NA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en_NA;
}

if (goog.LOCALE == 'en_NZ' || goog.LOCALE == 'en-NZ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en_NZ;
}

if (goog.LOCALE == 'en_PH' || goog.LOCALE == 'en-PH') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en_PH;
}

if (goog.LOCALE == 'en_PK' || goog.LOCALE == 'en-PK') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en_PK;
}

if (goog.LOCALE == 'en_SG' || goog.LOCALE == 'en-SG') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en_SG;
}

if (goog.LOCALE == 'en_Shaw' || goog.LOCALE == 'en-Shaw') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en_Shaw;
}

if (goog.LOCALE == 'en_TT' || goog.LOCALE == 'en-TT') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en_TT;
}

if (goog.LOCALE == 'en_UM' || goog.LOCALE == 'en-UM') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en;
}

if (goog.LOCALE == 'en_US' || goog.LOCALE == 'en-US') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en;
}

if (goog.LOCALE == 'en_VI' || goog.LOCALE == 'en-VI') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en;
}

if (goog.LOCALE == 'en_ZA' || goog.LOCALE == 'en-ZA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en_ZA;
}

if (goog.LOCALE == 'en_ZW' || goog.LOCALE == 'en-ZW') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_en_ZW;
}

if (goog.LOCALE == 'eo') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_eo;
}

if (goog.LOCALE == 'es') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es;
}

if (goog.LOCALE == 'es_AR' || goog.LOCALE == 'es-AR') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es;
}

if (goog.LOCALE == 'es_BO' || goog.LOCALE == 'es-BO') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es_BO;
}

if (goog.LOCALE == 'es_CL' || goog.LOCALE == 'es-CL') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es_CL;
}

if (goog.LOCALE == 'es_CO' || goog.LOCALE == 'es-CO') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es_CO;
}

if (goog.LOCALE == 'es_CR' || goog.LOCALE == 'es-CR') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es_CR;
}

if (goog.LOCALE == 'es_DO' || goog.LOCALE == 'es-DO') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es_DO;
}

if (goog.LOCALE == 'es_EC' || goog.LOCALE == 'es-EC') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es_EC;
}

if (goog.LOCALE == 'es_ES' || goog.LOCALE == 'es-ES') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es_ES;
}

if (goog.LOCALE == 'es_GT' || goog.LOCALE == 'es-GT') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es_GT;
}

if (goog.LOCALE == 'es_HN' || goog.LOCALE == 'es-HN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es_HN;
}

if (goog.LOCALE == 'es_MX' || goog.LOCALE == 'es-MX') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es_MX;
}

if (goog.LOCALE == 'es_NI' || goog.LOCALE == 'es-NI') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es_NI;
}

if (goog.LOCALE == 'es_PA' || goog.LOCALE == 'es-PA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es_PA;
}

if (goog.LOCALE == 'es_PE' || goog.LOCALE == 'es-PE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es_PE;
}

if (goog.LOCALE == 'es_PR' || goog.LOCALE == 'es-PR') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es_PR;
}

if (goog.LOCALE == 'es_PY' || goog.LOCALE == 'es-PY') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es_PY;
}

if (goog.LOCALE == 'es_SV' || goog.LOCALE == 'es-SV') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es_SV;
}

if (goog.LOCALE == 'es_US' || goog.LOCALE == 'es-US') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es_US;
}

if (goog.LOCALE == 'es_UY' || goog.LOCALE == 'es-UY') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es_UY;
}

if (goog.LOCALE == 'es_VE' || goog.LOCALE == 'es-VE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_es_VE;
}

if (goog.LOCALE == 'et') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_et;
}

if (goog.LOCALE == 'et_EE' || goog.LOCALE == 'et-EE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_et;
}

if (goog.LOCALE == 'eu') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_eu;
}

if (goog.LOCALE == 'eu_ES' || goog.LOCALE == 'eu-ES') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_eu;
}

if (goog.LOCALE == 'fa') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_fa;
}

if (goog.LOCALE == 'fa_AF' || goog.LOCALE == 'fa-AF') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_fa_AF;
}

if (goog.LOCALE == 'fa_IR' || goog.LOCALE == 'fa-IR') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_fa_IR;
}

if (goog.LOCALE == 'fi') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_fi;
}

if (goog.LOCALE == 'fi_FI' || goog.LOCALE == 'fi-FI') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_fi;
}

if (goog.LOCALE == 'fil') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_fil;
}

if (goog.LOCALE == 'fil_PH' || goog.LOCALE == 'fil-PH') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_fil;
}

if (goog.LOCALE == 'fo') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_fo;
}

if (goog.LOCALE == 'fo_FO' || goog.LOCALE == 'fo-FO') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_fo;
}

if (goog.LOCALE == 'fr') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_fr;
}

if (goog.LOCALE == 'fr_BE' || goog.LOCALE == 'fr-BE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_fr_BE;
}

if (goog.LOCALE == 'fr_CA' || goog.LOCALE == 'fr-CA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_fr_CA;
}

if (goog.LOCALE == 'fr_CH' || goog.LOCALE == 'fr-CH') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_fr_CH;
}

if (goog.LOCALE == 'fr_FR' || goog.LOCALE == 'fr-FR') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_fr;
}

if (goog.LOCALE == 'fr_LU' || goog.LOCALE == 'fr-LU') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_fr_LU;
}

if (goog.LOCALE == 'fr_MC' || goog.LOCALE == 'fr-MC') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_fr;
}

if (goog.LOCALE == 'fr_SN' || goog.LOCALE == 'fr-SN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_fr_SN;
}

if (goog.LOCALE == 'fur') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_fur;
}

if (goog.LOCALE == 'fur_IT' || goog.LOCALE == 'fur-IT') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_fur;
}

if (goog.LOCALE == 'ga') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ga;
}

if (goog.LOCALE == 'ga_IE' || goog.LOCALE == 'ga-IE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ga;
}

if (goog.LOCALE == 'gaa') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_gaa;
}

if (goog.LOCALE == 'gaa_GH' || goog.LOCALE == 'gaa-GH') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_gaa;
}

if (goog.LOCALE == 'gez') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_gez;
}

if (goog.LOCALE == 'gez_ER' || goog.LOCALE == 'gez-ER') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_gez;
}

if (goog.LOCALE == 'gez_ET' || goog.LOCALE == 'gez-ET') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_gez_ET;
}

if (goog.LOCALE == 'gl') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_gl;
}

if (goog.LOCALE == 'gl_ES' || goog.LOCALE == 'gl-ES') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_gl;
}

if (goog.LOCALE == 'gsw') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_gsw;
}

if (goog.LOCALE == 'gsw_CH' || goog.LOCALE == 'gsw-CH') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_gsw;
}

if (goog.LOCALE == 'gu') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_gu;
}

if (goog.LOCALE == 'gu_IN' || goog.LOCALE == 'gu-IN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_gu;
}

if (goog.LOCALE == 'gv') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_gv;
}

if (goog.LOCALE == 'gv_GB' || goog.LOCALE == 'gv-GB') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_gv;
}

if (goog.LOCALE == 'ha') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ha;
}

if (goog.LOCALE == 'ha_Arab' || goog.LOCALE == 'ha-Arab') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ha;
}

if (goog.LOCALE == 'ha_Arab_NG' || goog.LOCALE == 'ha-Arab-NG') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ha;
}

if (goog.LOCALE == 'ha_Arab_SD' || goog.LOCALE == 'ha-Arab-SD') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ha_Arab_SD;
}

if (goog.LOCALE == 'ha_GH' || goog.LOCALE == 'ha-GH') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ha_GH;
}

if (goog.LOCALE == 'ha_Latn' || goog.LOCALE == 'ha-Latn') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ha;
}

if (goog.LOCALE == 'ha_Latn_GH' || goog.LOCALE == 'ha-Latn-GH') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ha_Latn_GH;
}

if (goog.LOCALE == 'ha_Latn_NE' || goog.LOCALE == 'ha-Latn-NE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ha_Latn_NE;
}

if (goog.LOCALE == 'ha_Latn_NG' || goog.LOCALE == 'ha-Latn-NG') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ha;
}

if (goog.LOCALE == 'ha_NE' || goog.LOCALE == 'ha-NE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ha_NE;
}

if (goog.LOCALE == 'ha_NG' || goog.LOCALE == 'ha-NG') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ha;
}

if (goog.LOCALE == 'ha_SD' || goog.LOCALE == 'ha-SD') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ha_SD;
}

if (goog.LOCALE == 'haw') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_haw;
}

if (goog.LOCALE == 'haw_US' || goog.LOCALE == 'haw-US') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_haw;
}

if (goog.LOCALE == 'he') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_he;
}

if (goog.LOCALE == 'he_IL' || goog.LOCALE == 'he-IL') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_he;
}

if (goog.LOCALE == 'hi') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_hi;
}

if (goog.LOCALE == 'hi_IN' || goog.LOCALE == 'hi-IN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_hi;
}

if (goog.LOCALE == 'hr') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_hr;
}

if (goog.LOCALE == 'hr_HR' || goog.LOCALE == 'hr-HR') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_hr;
}

if (goog.LOCALE == 'hu') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_hu;
}

if (goog.LOCALE == 'hu_HU' || goog.LOCALE == 'hu-HU') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_hu;
}

if (goog.LOCALE == 'hy') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_hy;
}

if (goog.LOCALE == 'hy_AM' || goog.LOCALE == 'hy-AM') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_hy;
}

if (goog.LOCALE == 'ia') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ia;
}

if (goog.LOCALE == 'id') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_id;
}

if (goog.LOCALE == 'id_ID' || goog.LOCALE == 'id-ID') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_id;
}

if (goog.LOCALE == 'ig') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ig;
}

if (goog.LOCALE == 'ig_NG' || goog.LOCALE == 'ig-NG') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ig;
}

if (goog.LOCALE == 'ii') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ii;
}

if (goog.LOCALE == 'ii_CN' || goog.LOCALE == 'ii-CN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ii;
}

if (goog.LOCALE == 'in') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_in;
}

if (goog.LOCALE == 'is') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_is;
}

if (goog.LOCALE == 'is_IS' || goog.LOCALE == 'is-IS') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_is;
}

if (goog.LOCALE == 'it') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_it;
}

if (goog.LOCALE == 'it_CH' || goog.LOCALE == 'it-CH') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_it_CH;
}

if (goog.LOCALE == 'it_IT' || goog.LOCALE == 'it-IT') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_it_IT;
}

if (goog.LOCALE == 'iu') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_iu;
}

if (goog.LOCALE == 'iw') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_iw;
}

if (goog.LOCALE == 'ja') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ja;
}

if (goog.LOCALE == 'ja_JP' || goog.LOCALE == 'ja-JP') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ja;
}

if (goog.LOCALE == 'ka') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ka;
}

if (goog.LOCALE == 'ka_GE' || goog.LOCALE == 'ka-GE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ka;
}

if (goog.LOCALE == 'kaj') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kaj;
}

if (goog.LOCALE == 'kaj_NG' || goog.LOCALE == 'kaj-NG') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kaj;
}

if (goog.LOCALE == 'kam') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kam;
}

if (goog.LOCALE == 'kam_KE' || goog.LOCALE == 'kam-KE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kam;
}

if (goog.LOCALE == 'kcg') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kcg;
}

if (goog.LOCALE == 'kcg_NG' || goog.LOCALE == 'kcg-NG') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kcg;
}

if (goog.LOCALE == 'kfo') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kfo;
}

if (goog.LOCALE == 'kfo_CI' || goog.LOCALE == 'kfo-CI') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kfo_CI;
}

if (goog.LOCALE == 'kk') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kk;
}

if (goog.LOCALE == 'kk_Cyrl' || goog.LOCALE == 'kk-Cyrl') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kk;
}

if (goog.LOCALE == 'kk_Cyrl_KZ' || goog.LOCALE == 'kk-Cyrl-KZ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kk;
}

if (goog.LOCALE == 'kk_KZ' || goog.LOCALE == 'kk-KZ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kk;
}

if (goog.LOCALE == 'kl') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kl;
}

if (goog.LOCALE == 'kl_GL' || goog.LOCALE == 'kl-GL') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kl;
}

if (goog.LOCALE == 'km') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_km;
}

if (goog.LOCALE == 'km_KH' || goog.LOCALE == 'km-KH') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_km;
}

if (goog.LOCALE == 'kn') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kn;
}

if (goog.LOCALE == 'kn_IN' || goog.LOCALE == 'kn-IN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kn;
}

if (goog.LOCALE == 'ko') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ko;
}

if (goog.LOCALE == 'ko_KR' || goog.LOCALE == 'ko-KR') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ko_KR;
}

if (goog.LOCALE == 'kok') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kok;
}

if (goog.LOCALE == 'kok_IN' || goog.LOCALE == 'kok-IN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kok;
}

if (goog.LOCALE == 'kpe') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kpe;
}

if (goog.LOCALE == 'kpe_GN' || goog.LOCALE == 'kpe-GN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kpe;
}

if (goog.LOCALE == 'kpe_LR' || goog.LOCALE == 'kpe-LR') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kpe_LR;
}

if (goog.LOCALE == 'ku') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ku;
}

if (goog.LOCALE == 'ku_Arab' || goog.LOCALE == 'ku-Arab') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ku;
}

if (goog.LOCALE == 'ku_Arab_IQ' || goog.LOCALE == 'ku-Arab-IQ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ku;
}

if (goog.LOCALE == 'ku_Arab_IR' || goog.LOCALE == 'ku-Arab-IR') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ku_Arab_IR;
}

if (goog.LOCALE == 'ku_Arab_SY' || goog.LOCALE == 'ku-Arab-SY') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ku_Arab_SY;
}

if (goog.LOCALE == 'ku_IQ' || goog.LOCALE == 'ku-IQ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ku;
}

if (goog.LOCALE == 'ku_IR' || goog.LOCALE == 'ku-IR') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ku_IR;
}

if (goog.LOCALE == 'ku_Latn' || goog.LOCALE == 'ku-Latn') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ku;
}

if (goog.LOCALE == 'ku_Latn_TR' || goog.LOCALE == 'ku-Latn-TR') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ku_Latn_TR;
}

if (goog.LOCALE == 'ku_SY' || goog.LOCALE == 'ku-SY') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ku_SY;
}

if (goog.LOCALE == 'ku_TR' || goog.LOCALE == 'ku-TR') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ku_TR;
}

if (goog.LOCALE == 'kw') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kw;
}

if (goog.LOCALE == 'kw_GB' || goog.LOCALE == 'kw-GB') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_kw;
}

if (goog.LOCALE == 'ky') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ky;
}

if (goog.LOCALE == 'ky_KG' || goog.LOCALE == 'ky-KG') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ky;
}

if (goog.LOCALE == 'ln') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ln;
}

if (goog.LOCALE == 'ln_CD' || goog.LOCALE == 'ln-CD') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ln;
}

if (goog.LOCALE == 'ln_CG' || goog.LOCALE == 'ln-CG') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ln_CG;
}

if (goog.LOCALE == 'lo') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_lo;
}

if (goog.LOCALE == 'lo_LA' || goog.LOCALE == 'lo-LA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_lo;
}

if (goog.LOCALE == 'lt') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_lt;
}

if (goog.LOCALE == 'lt_LT' || goog.LOCALE == 'lt-LT') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_lt;
}

if (goog.LOCALE == 'lv') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_lv;
}

if (goog.LOCALE == 'lv_LV' || goog.LOCALE == 'lv-LV') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_lv;
}

if (goog.LOCALE == 'mk') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_mk;
}

if (goog.LOCALE == 'mk_MK' || goog.LOCALE == 'mk-MK') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_mk;
}

if (goog.LOCALE == 'ml') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ml;
}

if (goog.LOCALE == 'ml_IN' || goog.LOCALE == 'ml-IN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ml;
}

if (goog.LOCALE == 'mn') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_mn;
}

if (goog.LOCALE == 'mn_CN' || goog.LOCALE == 'mn-CN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_mn_CN;
}

if (goog.LOCALE == 'mn_Cyrl' || goog.LOCALE == 'mn-Cyrl') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_mn;
}

if (goog.LOCALE == 'mn_Cyrl_MN' || goog.LOCALE == 'mn-Cyrl-MN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_mn;
}

if (goog.LOCALE == 'mn_MN' || goog.LOCALE == 'mn-MN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_mn;
}

if (goog.LOCALE == 'mn_Mong' || goog.LOCALE == 'mn-Mong') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_mn;
}

if (goog.LOCALE == 'mn_Mong_CN' || goog.LOCALE == 'mn-Mong-CN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_mn_Mong_CN;
}

if (goog.LOCALE == 'mo') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_mo;
}

if (goog.LOCALE == 'mr') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_mr;
}

if (goog.LOCALE == 'mr_IN' || goog.LOCALE == 'mr-IN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_mr;
}

if (goog.LOCALE == 'ms') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ms;
}

if (goog.LOCALE == 'ms_BN' || goog.LOCALE == 'ms-BN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ms_BN;
}

if (goog.LOCALE == 'ms_MY' || goog.LOCALE == 'ms-MY') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ms_MY;
}

if (goog.LOCALE == 'mt') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_mt;
}

if (goog.LOCALE == 'mt_MT' || goog.LOCALE == 'mt-MT') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_mt;
}

if (goog.LOCALE == 'my') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_my;
}

if (goog.LOCALE == 'my_MM' || goog.LOCALE == 'my-MM') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_my;
}

if (goog.LOCALE == 'nb') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_nb;
}

if (goog.LOCALE == 'nb_NO' || goog.LOCALE == 'nb-NO') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_nb;
}

if (goog.LOCALE == 'nds') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_nds;
}

if (goog.LOCALE == 'nds_DE' || goog.LOCALE == 'nds-DE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_nds;
}

if (goog.LOCALE == 'ne') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ne;
}

if (goog.LOCALE == 'ne_IN' || goog.LOCALE == 'ne-IN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ne_IN;
}

if (goog.LOCALE == 'ne_NP' || goog.LOCALE == 'ne-NP') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ne;
}

if (goog.LOCALE == 'nl') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_nl;
}

if (goog.LOCALE == 'nl_BE' || goog.LOCALE == 'nl-BE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_nl_BE;
}

if (goog.LOCALE == 'nl_NL' || goog.LOCALE == 'nl-NL') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_nl;
}

if (goog.LOCALE == 'nn') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_nn;
}

if (goog.LOCALE == 'nn_NO' || goog.LOCALE == 'nn-NO') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_nn;
}

if (goog.LOCALE == 'no') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_no;
}

if (goog.LOCALE == 'nr') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_nr;
}

if (goog.LOCALE == 'nr_ZA' || goog.LOCALE == 'nr-ZA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_nr;
}

if (goog.LOCALE == 'nso') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_nso;
}

if (goog.LOCALE == 'nso_ZA' || goog.LOCALE == 'nso-ZA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_nso;
}

if (goog.LOCALE == 'ny') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ny;
}

if (goog.LOCALE == 'ny_MW' || goog.LOCALE == 'ny-MW') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ny;
}

if (goog.LOCALE == 'oc') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_oc;
}

if (goog.LOCALE == 'oc_FR' || goog.LOCALE == 'oc-FR') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_oc;
}

if (goog.LOCALE == 'om') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_om;
}

if (goog.LOCALE == 'om_ET' || goog.LOCALE == 'om-ET') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_om;
}

if (goog.LOCALE == 'om_KE' || goog.LOCALE == 'om-KE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_om_KE;
}

if (goog.LOCALE == 'or') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_or;
}

if (goog.LOCALE == 'or_IN' || goog.LOCALE == 'or-IN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_or;
}

if (goog.LOCALE == 'pa') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_pa;
}

if (goog.LOCALE == 'pa_Arab' || goog.LOCALE == 'pa-Arab') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_pa;
}

if (goog.LOCALE == 'pa_Arab_PK' || goog.LOCALE == 'pa-Arab-PK') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_pa;
}

if (goog.LOCALE == 'pa_Guru' || goog.LOCALE == 'pa-Guru') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_pa_Guru;
}

if (goog.LOCALE == 'pa_Guru_IN' || goog.LOCALE == 'pa-Guru-IN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_pa_Guru;
}

if (goog.LOCALE == 'pa_IN' || goog.LOCALE == 'pa-IN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_pa_IN;
}

if (goog.LOCALE == 'pa_PK' || goog.LOCALE == 'pa-PK') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_pa;
}

if (goog.LOCALE == 'pl') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_pl;
}

if (goog.LOCALE == 'pl_PL' || goog.LOCALE == 'pl-PL') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_pl;
}

if (goog.LOCALE == 'ps') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ps;
}

if (goog.LOCALE == 'ps_AF' || goog.LOCALE == 'ps-AF') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ps;
}

if (goog.LOCALE == 'pt') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_pt;
}

if (goog.LOCALE == 'pt_BR' || goog.LOCALE == 'pt-BR') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_pt_BR;
}

if (goog.LOCALE == 'pt_PT' || goog.LOCALE == 'pt-PT') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_pt_PT;
}

if (goog.LOCALE == 'ro') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ro;
}

if (goog.LOCALE == 'ro_MD' || goog.LOCALE == 'ro-MD') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ro;
}

if (goog.LOCALE == 'ro_RO' || goog.LOCALE == 'ro-RO') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ro_RO;
}

if (goog.LOCALE == 'ru') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ru;
}

if (goog.LOCALE == 'ru_RU' || goog.LOCALE == 'ru-RU') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ru_RU;
}

if (goog.LOCALE == 'ru_UA' || goog.LOCALE == 'ru-UA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ru_UA;
}

if (goog.LOCALE == 'rw') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_rw;
}

if (goog.LOCALE == 'rw_RW' || goog.LOCALE == 'rw-RW') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_rw;
}

if (goog.LOCALE == 'sa') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sa;
}

if (goog.LOCALE == 'sa_IN' || goog.LOCALE == 'sa-IN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sa;
}

if (goog.LOCALE == 'se') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_se;
}

if (goog.LOCALE == 'se_FI' || goog.LOCALE == 'se-FI') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_se;
}

if (goog.LOCALE == 'se_NO' || goog.LOCALE == 'se-NO') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_se_NO;
}

if (goog.LOCALE == 'sh') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sh;
}

if (goog.LOCALE == 'sh_BA' || goog.LOCALE == 'sh-BA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sh_BA;
}

if (goog.LOCALE == 'sh_CS' || goog.LOCALE == 'sh-CS') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sh_CS;
}

if (goog.LOCALE == 'sh_YU' || goog.LOCALE == 'sh-YU') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sh_YU;
}

if (goog.LOCALE == 'si') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_si;
}

if (goog.LOCALE == 'si_LK' || goog.LOCALE == 'si-LK') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_si;
}

if (goog.LOCALE == 'sid') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sid;
}

if (goog.LOCALE == 'sid_ET' || goog.LOCALE == 'sid-ET') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sid;
}

if (goog.LOCALE == 'sk') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sk;
}

if (goog.LOCALE == 'sk_SK' || goog.LOCALE == 'sk-SK') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sk;
}

if (goog.LOCALE == 'sl') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sl;
}

if (goog.LOCALE == 'sl_SI' || goog.LOCALE == 'sl-SI') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sl;
}

if (goog.LOCALE == 'so') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_so;
}

if (goog.LOCALE == 'so_DJ' || goog.LOCALE == 'so-DJ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_so;
}

if (goog.LOCALE == 'so_ET' || goog.LOCALE == 'so-ET') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_so_ET;
}

if (goog.LOCALE == 'so_KE' || goog.LOCALE == 'so-KE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_so_KE;
}

if (goog.LOCALE == 'so_SO' || goog.LOCALE == 'so-SO') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_so_SO;
}

if (goog.LOCALE == 'sq') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sq;
}

if (goog.LOCALE == 'sq_AL' || goog.LOCALE == 'sq-AL') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sq_AL;
}

if (goog.LOCALE == 'sr') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sr;
}

if (goog.LOCALE == 'sr_BA' || goog.LOCALE == 'sr-BA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sr;
}

if (goog.LOCALE == 'sr_CS' || goog.LOCALE == 'sr-CS') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sr_CS;
}

if (goog.LOCALE == 'sr_Cyrl' || goog.LOCALE == 'sr-Cyrl') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sr_Cyrl;
}

if (goog.LOCALE == 'sr_Cyrl_BA' || goog.LOCALE == 'sr-Cyrl-BA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sr;
}

if (goog.LOCALE == 'sr_Cyrl_CS' || goog.LOCALE == 'sr-Cyrl-CS') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sr_Cyrl;
}

if (goog.LOCALE == 'sr_Cyrl_ME' || goog.LOCALE == 'sr-Cyrl-ME') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sr_Cyrl;
}

if (goog.LOCALE == 'sr_Cyrl_RS' || goog.LOCALE == 'sr-Cyrl-RS') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sr_Cyrl_RS;
}

if (goog.LOCALE == 'sr_Cyrl_YU' || goog.LOCALE == 'sr-Cyrl-YU') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sr_Cyrl_YU;
}

if (goog.LOCALE == 'sr_Latn' || goog.LOCALE == 'sr-Latn') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sr_Latn;
}

if (goog.LOCALE == 'sr_Latn_BA' || goog.LOCALE == 'sr-Latn-BA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sr;
}

if (goog.LOCALE == 'sr_Latn_CS' || goog.LOCALE == 'sr-Latn-CS') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sr_Latn_CS;
}

if (goog.LOCALE == 'sr_Latn_ME' || goog.LOCALE == 'sr-Latn-ME') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sr_Latn_ME;
}

if (goog.LOCALE == 'sr_Latn_RS' || goog.LOCALE == 'sr-Latn-RS') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sr_Latn;
}

if (goog.LOCALE == 'sr_Latn_YU' || goog.LOCALE == 'sr-Latn-YU') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sr_Latn_YU;
}

if (goog.LOCALE == 'sr_ME' || goog.LOCALE == 'sr-ME') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sr_ME;
}

if (goog.LOCALE == 'sr_RS' || goog.LOCALE == 'sr-RS') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sr_RS;
}

if (goog.LOCALE == 'sr_YU' || goog.LOCALE == 'sr-YU') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sr_YU;
}

if (goog.LOCALE == 'ss') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ss;
}

if (goog.LOCALE == 'ss_SZ' || goog.LOCALE == 'ss-SZ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ss_SZ;
}

if (goog.LOCALE == 'ss_ZA' || goog.LOCALE == 'ss-ZA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ss;
}

if (goog.LOCALE == 'st') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_st;
}

if (goog.LOCALE == 'st_LS' || goog.LOCALE == 'st-LS') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_st_LS;
}

if (goog.LOCALE == 'st_ZA' || goog.LOCALE == 'st-ZA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_st;
}

if (goog.LOCALE == 'sv') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sv;
}

if (goog.LOCALE == 'sv_FI' || goog.LOCALE == 'sv-FI') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sv;
}

if (goog.LOCALE == 'sv_SE' || goog.LOCALE == 'sv-SE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sv_SE;
}

if (goog.LOCALE == 'sw') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sw;
}

if (goog.LOCALE == 'sw_KE' || goog.LOCALE == 'sw-KE') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sw_KE;
}

if (goog.LOCALE == 'sw_TZ' || goog.LOCALE == 'sw-TZ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_sw_TZ;
}

if (goog.LOCALE == 'syr') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_syr;
}

if (goog.LOCALE == 'syr_SY' || goog.LOCALE == 'syr-SY') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_syr;
}

if (goog.LOCALE == 'ta') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ta;
}

if (goog.LOCALE == 'ta_IN' || goog.LOCALE == 'ta-IN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ta;
}

if (goog.LOCALE == 'te') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_te;
}

if (goog.LOCALE == 'te_IN' || goog.LOCALE == 'te-IN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_te;
}

if (goog.LOCALE == 'tg') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_tg;
}

if (goog.LOCALE == 'tg_Cyrl' || goog.LOCALE == 'tg-Cyrl') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_tg;
}

if (goog.LOCALE == 'tg_Cyrl_TJ' || goog.LOCALE == 'tg-Cyrl-TJ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_tg;
}

if (goog.LOCALE == 'tg_TJ' || goog.LOCALE == 'tg-TJ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_tg;
}

if (goog.LOCALE == 'th') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_th;
}

if (goog.LOCALE == 'th_TH' || goog.LOCALE == 'th-TH') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_th;
}

if (goog.LOCALE == 'ti') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ti;
}

if (goog.LOCALE == 'ti_ER' || goog.LOCALE == 'ti-ER') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ti;
}

if (goog.LOCALE == 'ti_ET' || goog.LOCALE == 'ti-ET') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ti_ET;
}

if (goog.LOCALE == 'tig') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_tig;
}

if (goog.LOCALE == 'tig_ER' || goog.LOCALE == 'tig-ER') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_tig;
}

if (goog.LOCALE == 'tl') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_tl;
}

if (goog.LOCALE == 'tl_PH' || goog.LOCALE == 'tl-PH') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_tl;
}

if (goog.LOCALE == 'tn') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_tn;
}

if (goog.LOCALE == 'tn_ZA' || goog.LOCALE == 'tn-ZA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_tn_ZA;
}

if (goog.LOCALE == 'to') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_to;
}

if (goog.LOCALE == 'to_TO' || goog.LOCALE == 'to-TO') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_to;
}

if (goog.LOCALE == 'tr') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_tr;
}

if (goog.LOCALE == 'tr_TR' || goog.LOCALE == 'tr-TR') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_tr_TR;
}

if (goog.LOCALE == 'trv') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_trv;
}

if (goog.LOCALE == 'trv_TW' || goog.LOCALE == 'trv-TW') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_trv;
}

if (goog.LOCALE == 'ts') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ts;
}

if (goog.LOCALE == 'ts_ZA' || goog.LOCALE == 'ts-ZA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ts;
}

if (goog.LOCALE == 'tt') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_tt;
}

if (goog.LOCALE == 'tt_RU' || goog.LOCALE == 'tt-RU') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_tt;
}

if (goog.LOCALE == 'ug') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ug;
}

if (goog.LOCALE == 'ug_Arab' || goog.LOCALE == 'ug-Arab') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ug;
}

if (goog.LOCALE == 'ug_Arab_CN' || goog.LOCALE == 'ug-Arab-CN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ug;
}

if (goog.LOCALE == 'ug_CN' || goog.LOCALE == 'ug-CN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ug;
}

if (goog.LOCALE == 'uk') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_uk;
}

if (goog.LOCALE == 'uk_UA' || goog.LOCALE == 'uk-UA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_uk;
}

if (goog.LOCALE == 'ur') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ur;
}

if (goog.LOCALE == 'ur_IN' || goog.LOCALE == 'ur-IN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ur_IN;
}

if (goog.LOCALE == 'ur_PK' || goog.LOCALE == 'ur-PK') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ur_PK;
}

if (goog.LOCALE == 'uz') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_uz;
}

if (goog.LOCALE == 'uz_AF' || goog.LOCALE == 'uz-AF') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_uz_AF;
}

if (goog.LOCALE == 'uz_Arab' || goog.LOCALE == 'uz-Arab') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_uz_Arab;
}

if (goog.LOCALE == 'uz_Arab_AF' || goog.LOCALE == 'uz-Arab-AF') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_uz_Arab;
}

if (goog.LOCALE == 'uz_Cyrl' || goog.LOCALE == 'uz-Cyrl') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_uz_Cyrl;
}

if (goog.LOCALE == 'uz_Cyrl_UZ' || goog.LOCALE == 'uz-Cyrl-UZ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_uz_Cyrl;
}

if (goog.LOCALE == 'uz_Latn' || goog.LOCALE == 'uz-Latn') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_uz_Latn;
}

if (goog.LOCALE == 'uz_Latn_UZ' || goog.LOCALE == 'uz-Latn-UZ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_uz_Latn;
}

if (goog.LOCALE == 'uz_UZ' || goog.LOCALE == 'uz-UZ') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_uz_UZ;
}

if (goog.LOCALE == 've') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ve;
}

if (goog.LOCALE == 've_ZA' || goog.LOCALE == 've-ZA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_ve;
}

if (goog.LOCALE == 'vi') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_vi;
}

if (goog.LOCALE == 'vi_VN' || goog.LOCALE == 'vi-VN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_vi;
}

if (goog.LOCALE == 'wal') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_wal;
}

if (goog.LOCALE == 'wal_ET' || goog.LOCALE == 'wal-ET') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_wal;
}

if (goog.LOCALE == 'wo') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_wo;
}

if (goog.LOCALE == 'wo_Latn' || goog.LOCALE == 'wo-Latn') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_wo;
}

if (goog.LOCALE == 'wo_Latn_SN' || goog.LOCALE == 'wo-Latn-SN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_wo;
}

if (goog.LOCALE == 'wo_SN' || goog.LOCALE == 'wo-SN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_wo;
}

if (goog.LOCALE == 'xh') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_xh;
}

if (goog.LOCALE == 'xh_ZA' || goog.LOCALE == 'xh-ZA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_xh;
}

if (goog.LOCALE == 'yo') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_yo;
}

if (goog.LOCALE == 'yo_NG' || goog.LOCALE == 'yo-NG') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_yo;
}

if (goog.LOCALE == 'zh') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_zh;
}

if (goog.LOCALE == 'zh_CN' || goog.LOCALE == 'zh-CN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_zh;
}

if (goog.LOCALE == 'zh_HK' || goog.LOCALE == 'zh-HK') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_zh_HK;
}

if (goog.LOCALE == 'zh_Hans' || goog.LOCALE == 'zh-Hans') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_zh;
}

if (goog.LOCALE == 'zh_Hans_CN' || goog.LOCALE == 'zh-Hans-CN') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_zh;
}

if (goog.LOCALE == 'zh_Hans_HK' || goog.LOCALE == 'zh-Hans-HK') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_zh_Hans_HK;
}

if (goog.LOCALE == 'zh_Hans_MO' || goog.LOCALE == 'zh-Hans-MO') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_zh_Hans_MO;
}

if (goog.LOCALE == 'zh_Hans_SG' || goog.LOCALE == 'zh-Hans-SG') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_zh_Hans_SG;
}

if (goog.LOCALE == 'zh_Hant' || goog.LOCALE == 'zh-Hant') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_zh_Hant;
}

if (goog.LOCALE == 'zh_Hant_HK' || goog.LOCALE == 'zh-Hant-HK') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_zh_Hant_HK;
}

if (goog.LOCALE == 'zh_Hant_MO' || goog.LOCALE == 'zh-Hant-MO') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_zh_Hant_MO;
}

if (goog.LOCALE == 'zh_Hant_TW' || goog.LOCALE == 'zh-Hant-TW') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_zh_Hant;
}

if (goog.LOCALE == 'zh_MO' || goog.LOCALE == 'zh-MO') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_zh_MO;
}

if (goog.LOCALE == 'zh_SG' || goog.LOCALE == 'zh-SG') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_zh_SG;
}

if (goog.LOCALE == 'zh_TW' || goog.LOCALE == 'zh-TW') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_zh_TW;
}

if (goog.LOCALE == 'zu') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_zu;
}

if (goog.LOCALE == 'zu_ZA' || goog.LOCALE == 'zu-ZA') {
  goog.i18n.NumberFormatSymbols = goog.i18n.NumberFormatSymbols_zu;
}


// Input 2
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Currency code map.
 *
 */


/**
 * Namespace for locale number format functions
 */
goog.provide('goog.i18n.currencyCodeMap');


/**
 * The mapping of currency symbol through intl currency code.
 * The source of information is mostly from wikipedia and CLDR. Since there is
 * no authoritive source, items are judged by personal perception.

 * If an application need currency support that available in tier2, it
 * should extend currencyCodeMap to include tier2 data by doing this:
 *     goog.object.extend(goog.i18n.currencyCodeMap,
 *                        goog.i18n.currencyCodeMapTier2);
 *
 * @type {Object}
 * @const
 */
goog.i18n.currencyCodeMap = {
  'AED': '\u062F\u002e\u0625',
  'ARS': '$',
  'AUD': '$',
  'BDT': '\u09F3',
  'BRL': 'R$',
  'CAD': '$',
  'CHF': 'Fr.',
  'CLP': '$',
  'CNY': '\u00a5',
  'COP': '$',
  'CRC': '\u20a1',
  'CUP': '$',
  'CZK': 'K\u010d',
  'DKK': 'kr',
  'DOP': '$',
  'EGP': '\u00a3',
  'EUR': '\u20ac',
  'GBP': '\u00a3',
  'HKD': '$',
  'HRK': 'kn',
  'HUF': 'Ft',
  'IDR': 'Rp',
  'ILS': '\u20AA',
  'INR': 'Rs',
  'IQD': '\u0639\u062F',
  'ISK': 'kr',
  'JMD': '$',
  'JPY': '\u00a5',
  'KRW': '\u20A9',
  'KWD': '\u062F\u002e\u0643',
  'LKR': 'Rs',
  'LVL': 'Ls',
  'MNT': '\u20AE',
  'MXN': '$',
  'MYR': 'RM',
  'NOK': 'kr',
  'NZD': '$',
  'PAB': 'B/.',
  'PEN': 'S/.',
  'PHP': 'P',
  'PKR': 'Rs.',
  'PLN': 'z\u0142',
  'RON': 'L',
  'RUB': '\u0440\u0443\u0431',
  'SAR': '\u0633\u002E\u0631',
  'SEK': 'kr',
  'SGD': '$',
  'SKK': 'Sk',
  'SYP': 'SYP',
  'THB': '\u0e3f',
  'TRY': 'TL',
  'TWD': 'NT$',
  'USD': '$',
  'UYU': '$',
  'VEF': 'Bs.F',
  'VND': '\u20AB',
  'XAF': 'FCFA',
  'XCD': '$',
  'YER': 'YER',
  'ZAR': 'R'
};


/**
 * This group of currency data is unlikely to be used. In case they are,
 * program need to merge it into goog.locale.CurrencyCodeMap.
 *
 * @type {Object}
 * @const
 */
goog.i18n.currencyCodeMapTier2 = {
  'AFN': '\u060b',
  'ALL': 'Lek',
  'AMD': '\u0564\u0580\u002e',
  'ANG': '\u0083',
  'AOA': 'Kz',
  'AWG': '\u0192',
  'AZN': 'm',
  'BAM': '\u041a\u041c',
  'BBD': '$',
  'BGN': '\u043b\u0432',
  'BHD': '\u0628\u002e\u062f\u002e',
  'BIF': 'FBu',
  'BMD': '$',
  'BND': '$',
  'BOB': 'B$',
  'BSD': '$',
  'BTN': 'Nu.',
  'BWP': 'P',
  'BYR': 'Br',
  'BZD': '$',
  'CDF': 'F',
  'CVE': '$',
  'DJF': 'Fdj',
  'DZD': '\u062f\u062C',
  'EEK': 'EEK',
  'ERN': 'Nfk',
  'ETB': 'Br',
  'FJD': '$',
  'FKP': '\u00a3',
  'GEL': 'GEL',
  'GHS': '\u20B5',
  'GIP': '\u00a3',
  'GMD': 'D',
  'GNF': 'FG',
  'GTQ': 'Q',
  'GYD': '$',
  'HNL': 'L',
  'HTG': 'G',
  'IRR': '\ufdfc',
  'JOD': 'JOD',
  'KES': 'KSh',
  'KGS': 'som',
  'KHR': '\u17DB',
  'KMF': 'KMF',
  'KPW': '\u20A9',
  'KYD': '$',
  'KZT': 'KZT',
  'LAK': '\u20AD',
  'LBP': '\u0644\u002e\u0644',
  'LRD': '$',
  'LSL': 'L',
  'LTL': 'Lt',
  'LYD': '\u0644\u002e\u062F',
  'MAD': '\u0645\u002E\u062F\u002E',
  'MDL': 'MDL',
  'MGA': 'MGA',
  'MKD': 'MKD',
  'MMK': 'K',
  'MOP': 'MOP$',
  'MRO': 'UM',
  'MUR': 'Rs',
  'MVR': 'Rf',
  'MWK': 'MK',
  'MZN': 'MTn',
  'NAD': '$',
  'NGN': '\u20A6',
  'NIO': 'C$',
  'NPR': 'Rs',
  'OMR': '\u0639\u002E\u062F\u002E',
  'PGK': 'K',
  'PYG': '\u20b2',
  'QAR': '\u0642\u002E\u0631',
  'RSD': '\u0420\u0421\u0414',
  'RWF': 'RF',
  'SBD': '$',
  'SCR': 'SR',
  'SDG': 'SDG',
  'SHP': '\u00a3',
  'SLL': 'Le',
  'SOS': 'So. Sh.',
  'SRD': '$',
  'STD': 'Db',
  'SZL': 'L',
  'TJS': 'TJS',
  'TMM': 'm',
  'TND': '\u062F\u002e\u062A ',
  'TOP': 'T$',
  'TTD': '$',
  'TZS': 'TZS',
  'UAH': 'UAH',
  'UGX': 'USh',
  'UZS': 'UZS',
  'VUV': 'Vt',
  'WST': 'WS$',
  'XOF': 'CFA',
  'XPF': 'F',
  'ZMK': 'ZK',
  'ZWD': '$'
};


// Input 3
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Number format/parse library with locale support.
 *
 */

/**
 * Namespace for locale number format functions
 */
goog.provide('goog.i18n.NumberFormat');

goog.require('goog.i18n.NumberFormatSymbols');
goog.require('goog.i18n.currencyCodeMap');



/**
 * Constructor of NumberFormat.
 * @param {number|string} pattern The number that indicates a predefined
 *     number format pattern.
 * @param {string=} opt_currency Optional international currency code. This
 *     determines the currency code/symbol used in format/parse. If not given,
 *     the currency code for current locale will be used.
 * @constructor
 */
goog.i18n.NumberFormat = function(pattern, opt_currency) {
  this.intlCurrencyCode_ = opt_currency ||
      goog.i18n.NumberFormatSymbols.DEF_CURRENCY_CODE;
  this.currencySymbol_ = goog.i18n.currencyCodeMap[this.intlCurrencyCode_];

  this.maximumIntegerDigits_ = 40;
  this.minimumIntegerDigits_ = 1;
  this.maximumFractionDigits_ = 3; // invariant, >= minFractionDigits
  this.minimumFractionDigits_ = 0;
  this.minExponentDigits_ = 0;

  this.positivePrefix_ = '';
  this.positiveSuffix_ = '';
  this.negativePrefix_ = '-';
  this.negativeSuffix_ = '';

  // The multiplier for use in percent, per mille, etc.
  this.multiplier_ = 1;
  this.groupingSize_ = 3;
  this.decimalSeparatorAlwaysShown_ = false;
  this.useExponentialNotation_ = false;

  if (typeof pattern == 'number') {
    this.applyStandardPattern_(pattern);
  } else {
    this.applyPattern_(pattern);
  }
};


/**
 * Standard number formatting patterns.
 * @enum {number}
 */
goog.i18n.NumberFormat.Format = {
  DECIMAL: 1,
  SCIENTIFIC: 2,
  PERCENT: 3,
  CURRENCY: 4
};


/**
 * Apply provided pattern, result are stored in member variables.
 *
 * @param {string} pattern String pattern being applied.
 * @private
 */
goog.i18n.NumberFormat.prototype.applyPattern_ = function(pattern) {
  this.pattern_ = pattern.replace(/ /g, '\u00a0');
  var pos = [0];

  this.positivePrefix_ = this.parseAffix_(pattern, pos);
  var trunkStart = pos[0];
  this.parseTrunk_(pattern, pos);
  var trunkLen = pos[0] - trunkStart;
  this.positiveSuffix_ = this.parseAffix_(pattern, pos);
  if (pos[0] < pattern.length &&
      pattern.charAt(pos[0]) == goog.i18n.NumberFormat.PATTERN_SEPARATOR_) {
    pos[0]++;
    this.negativePrefix_ = this.parseAffix_(pattern, pos);
    // we assume this part is identical to positive part.
    // user must make sure the pattern is correctly constructed.
    pos[0] += trunkLen;
    this.negativeSuffix_ = this.parseAffix_(pattern, pos);
  } else {
    // if no negative affix specified, they share the same positive affix
    this.negativePrefix_ = this.positivePrefix_ + this.negativePrefix_;
    this.negativeSuffix_ += this.positiveSuffix_;
  }
};


/**
 * Apply a predefined pattern to NumberFormat object.
 * @param {number} patternType The number that indicates a predefined number
 *     format pattern.
 * @private
 */
goog.i18n.NumberFormat.prototype.applyStandardPattern_ = function(patternType) {
  switch (patternType) {
    case goog.i18n.NumberFormat.Format.DECIMAL:
      this.applyPattern_(goog.i18n.NumberFormatSymbols.DECIMAL_PATTERN);
      break;
    case goog.i18n.NumberFormat.Format.SCIENTIFIC:
      this.applyPattern_(goog.i18n.NumberFormatSymbols.SCIENTIFIC_PATTERN);
      break;
    case goog.i18n.NumberFormat.Format.PERCENT:
      this.applyPattern_(goog.i18n.NumberFormatSymbols.PERCENT_PATTERN);
      break;
    case goog.i18n.NumberFormat.Format.CURRENCY:
      this.applyPattern_(goog.i18n.NumberFormatSymbols.CURRENCY_PATTERN);
      break;
    default:
      throw Error('Unsupported pattern type.');
  }
};


/**
 * Parses text string to produce a Number.
 *
 * This method attempts to parse text starting from position "opt_pos" if it
 * is given. Otherwise the parse will start from the beginning of the text.
 * When opt_pos presents, opt_pos will be updated to the character next to where
 * parsing stops after the call. If an error occurs, opt_pos won't be updated.
 *
 * @param {string} text The string to be parsed.
 * @param {Array.<number>=} opt_pos Position to pass in and get back.
 * @return {number} Parsed number. This throws an error if the text cannot be
 *     parsed.
 */
goog.i18n.NumberFormat.prototype.parse = function(text, opt_pos) {
  var pos = opt_pos || [0];

  var start = pos[0];
  var ret = NaN;

  // we don't want to handle 2 kind of space in parsing, normalize it to nbsp
  text = text.replace(/ /g, '\u00a0');

  var gotPositive = text.indexOf(this.positivePrefix_, pos[0]) == pos[0];
  var gotNegative = text.indexOf(this.negativePrefix_, pos[0]) == pos[0];

  // check for the longest match
  if (gotPositive && gotNegative) {
    if (this.positivePrefix_.length > this.negativePrefix_.length) {
      gotNegative = false;
    } else if (this.positivePrefix_.length < this.negativePrefix_.length) {
      gotPositive = false;
    }
  }

  if (gotPositive) {
    pos[0] += this.positivePrefix_.length;
  } else if (gotNegative) {
    pos[0] += this.negativePrefix_.length;
  }

  // process digits or Inf, find decimal position
  if (text.indexOf(goog.i18n.NumberFormatSymbols.INFINITY, pos[0]) == pos[0]) {
    pos[0] += goog.i18n.NumberFormatSymbols.INFINITY.length;
    ret = Infinity;
  } else {
    ret = this.parseNumber_(text, pos);
  }

  // check for suffix
  if (gotPositive) {
    if (!(text.indexOf(this.positiveSuffix_, pos[0]) == pos[0])) {
      return NaN;
    }
    pos[0] += this.positiveSuffix_.length;
  } else if (gotNegative) {
    if (!(text.indexOf(this.negativeSuffix_, pos[0]) == pos[0])) {
      return NaN;
    }
    pos[0] += this.negativeSuffix_.length;
  }

  return gotNegative ? -ret : ret;
};


/**
 * This function will parse a "localized" text into a Number. It needs to
 * handle locale specific decimal, grouping, exponent and digits.
 *
 * @param {string} text The text that need to be parsed.
 * @param {Array.<number>} pos  In/out parsing position. In case of failure,
 *    pos value won't be changed.
 * @return {number} Number value, or NaN if nothing can be parsed.
 * @private
 */
goog.i18n.NumberFormat.prototype.parseNumber_ = function(text, pos) {
  var sawDecimal = false;
  var sawExponent = false;
  var sawDigit = false;
  var scale = 1;
  var decimal = goog.i18n.NumberFormatSymbols.DECIMAL_SEP;
  var grouping = goog.i18n.NumberFormatSymbols.GROUP_SEP;
  var exponentChar = goog.i18n.NumberFormatSymbols.EXP_SYMBOL;

  var normalizedText = '';
  for (; pos[0] < text.length; pos[0]++) {
    var ch = text.charAt(pos[0]);
    var digit = this.getDigit_(ch);
    if (digit >= 0 && digit <= 9) {
      normalizedText += digit;
      sawDigit = true;
    } else if (ch == decimal.charAt(0)) {
      if (sawDecimal || sawExponent) {
        break;
      }
      normalizedText += '.';
      sawDecimal = true;
    } else if (ch == grouping.charAt(0) &&
               ('\u00a0' != grouping.charAt(0) ||
                pos[0] + 1 < text.length &&
                this.getDigit_(text.charAt(pos[0] + 1)) >= 0)) {
      // Got a grouping character here. When grouping character is nbsp, need
      // to make sure the character following it is a digit.
      if (sawDecimal || sawExponent) {
        break;
      }
      continue;
    } else if (ch == exponentChar.charAt(0)) {
      if (sawExponent) {
        break;
      }
      normalizedText += 'E';
      sawExponent = true;
    } else if (ch == '+' || ch == '-') {
      normalizedText += ch;
    } else if (ch == goog.i18n.NumberFormatSymbols.PERCENT.charAt(0)) {
      if (scale != 1) {
        break;
      }
      scale = 100;
      if (sawDigit) {
        pos[0]++; // eat this character if parse end here
        break;
      }
    } else if (ch == goog.i18n.NumberFormatSymbols.PERMILL.charAt(0)) {
      if (scale != 1) {
        break;
      }
      scale = 1000;
      if (sawDigit) {
        pos[0]++; // eat this character if parse end here
        break;
      }
    } else {
      break;
    }
  }
  return parseFloat(normalizedText) / scale;
};


/**
 * Formats a Number to produce a string.
 *
 * @param {number} number The Number to be formatted.
 * @return {string} The formatted number string.
 */
goog.i18n.NumberFormat.prototype.format = function(number) {
  if (isNaN(number)) {
    return goog.i18n.NumberFormatSymbols.NAN;
  }

  var parts = [];

  // in icu code, it is commented that certain computation need to keep the
  // negative sign for 0.
  var isNegative = number < 0.0 || number == 0.0 && 1 / number < 0.0;

  parts.push(isNegative ? this.negativePrefix_ : this.positivePrefix_);

  if (!isFinite(number)) {
    parts.push(goog.i18n.NumberFormatSymbols.INFINITY);
  } else {
    // convert number to non-negative value
    number *= isNegative ? -1 : 1;

    number *= this.multiplier_;
    this.useExponentialNotation_ ?
      this.subformatExponential_(number, parts) :
      this.subformatFixed_(number, this.minimumIntegerDigits_, parts);
  }

  parts.push(isNegative ? this.negativeSuffix_ : this.positiveSuffix_);

  return parts.join('');
};


/**
 * Formats a Number in fraction format.
 *
 * @param {number} number Value need to be formated.
 * @param {number} minIntDigits Minimum integer digits.
 * @param {Array} parts This array holds the pieces of formatted string.
 *     This function will add its formatted pieces to the array.
 * @private
 */
goog.i18n.NumberFormat.prototype.subformatFixed_ =
    function(number, minIntDigits, parts) {
  // round the number
  var power = Math.pow(10, this.maximumFractionDigits_);
  number = Math.round(number * power);
  var intValue = Math.floor(number / power);
  var fracValue = Math.floor(number - intValue * power);

  var fractionPresent = this.minimumFractionDigits_ > 0 || fracValue > 0;

  var intPart = '';
  var translatableInt = intValue;
  while (translatableInt > 1E20) {
    // here it goes beyond double precision, add '0' make it look better
    intPart = '0' + intPart;
    translatableInt = Math.round(translatableInt / 10);
  }
  intPart = translatableInt + intPart;

  var decimal = goog.i18n.NumberFormatSymbols.DECIMAL_SEP;
  var grouping = goog.i18n.NumberFormatSymbols.GROUP_SEP;
  var zeroCode = goog.i18n.NumberFormatSymbols.ZERO_DIGIT.charCodeAt(0);
  var digitLen = intPart.length;

  if (intValue > 0 || minIntDigits > 0) {
    for (var i = digitLen; i < minIntDigits; i++) {
      parts.push(goog.i18n.NumberFormatSymbols.ZERO_DIGIT);
    }

    for (var i = 0; i < digitLen; i++) {
      parts.push(String.fromCharCode(zeroCode + intPart.charAt(i) * 1));

      if (digitLen - i > 1 && this.groupingSize_ > 0 &&
          ((digitLen - i) % this.groupingSize_ == 1)) {
        parts.push(grouping);
      }
    }
  } else if (!fractionPresent) {
    // If there is no fraction present, and we haven't printed any
    // integer digits, then print a zero.
    parts.push(goog.i18n.NumberFormatSymbols.ZERO_DIGIT);
  }

  // Output the decimal separator if we always do so.
  if (this.decimalSeparatorAlwaysShown_ || fractionPresent) {
    parts.push(decimal);
  }

  var fracPart = '' + (fracValue + power);
  var fracLen = fracPart.length;
  while (fracPart.charAt(fracLen - 1) == '0' &&
         fracLen > this.minimumFractionDigits_ + 1) {
    fracLen--;
  }

  for (var i = 1; i < fracLen; i++) {
    parts.push(String.fromCharCode(zeroCode + fracPart.charAt(i) * 1));
  }
};


/**
 * Formats exponent part of a Number.
 *
 * @param {number} exponent Exponential value.
 * @param {Array.<string>} parts The array that holds the pieces of formatted
 *     string. This function will append more formatted pieces to the array.
 * @private
 */
goog.i18n.NumberFormat.prototype.addExponentPart_ = function(exponent, parts) {
  parts.push(goog.i18n.NumberFormatSymbols.EXP_SYMBOL);

  if (exponent < 0) {
    exponent = -exponent;
    parts.push(goog.i18n.NumberFormatSymbols.MINUS_SIGN);
  }

  var exponentDigits = '' + exponent;
  for (var i = exponentDigits.length; i < this.minExponentDigits_; i++) {
    parts.push(goog.i18n.NumberFormatSymbols.ZERO_DIGIT);
  }
  parts.push(exponentDigits);
};


/**
 * Formats Number in exponential format.
 *
 * @param {number} number Value need to be formated.
 * @param {Array.<string>} parts The array that holds the pieces of formatted
 *     string. This function will append more formatted pieces to the array.
 * @private
 */
goog.i18n.NumberFormat.prototype.subformatExponential_ =
    function(number, parts) {
  if (number == 0.0) {
    this.subformatFixed_(number, this.minimumIntegerDigits_, parts);
    this.addExponentPart_(0, parts);
    return;
  }

  var exponent = Math.floor(Math.log(number) / Math.log(10));
  number /= Math.pow(10, exponent);

  var minIntDigits = this.minimumIntegerDigits_;
  if (this.maximumIntegerDigits_ > 1 &&
      this.maximumIntegerDigits_ > this.minimumIntegerDigits_) {
    // A repeating range is defined; adjust to it as follows.
    // If repeat == 3, we have 6,5,4=>3; 3,2,1=>0; 0,-1,-2=>-3;
    // -3,-4,-5=>-6, etc. This takes into account that the
    // exponent we have here is off by one from what we expect;
    // it is for the format 0.MMMMMx10^n.
    while ((exponent % this.maximumIntegerDigits_) != 0) {
      number *= 10;
      exponent--;
    }
    minIntDigits = 1;
  } else {
    // No repeating range is defined; use minimum integer digits.
    if (this.minimumIntegerDigits_ < 1) {
      exponent++;
      number /= 10;
    } else {
      exponent -= this.minimumIntegerDigits_ - 1;
      number *= Math.pow(10, this.minimumIntegerDigits_ - 1);
    }
  }
  this.subformatFixed_(number, minIntDigits, parts);
  this.addExponentPart_(exponent, parts);
};


/**
 * Returns the digit value of current character. The character could be either
 * '0' to '9', or a locale specific digit.
 *
 * @param {string} ch Character that represents a digit.
 * @return {number} The digit value, or -1 on error.
 * @private
 */
goog.i18n.NumberFormat.prototype.getDigit_ = function(ch) {
  var code = ch.charCodeAt(0);
  // between '0' to '9'
  if (48 <= code && code < 58) {
    return code - 48;
  } else {
    var zeroCode = goog.i18n.NumberFormatSymbols.ZERO_DIGIT.charCodeAt(0);
    return zeroCode <= code && code < zeroCode + 10 ? code - zeroCode : -1;
  }
};


// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------
// Constants for characters used in programmatic (unlocalized) patterns.
/**
 * A zero digit character.
 * @type {string}
 * @private
 */
goog.i18n.NumberFormat.PATTERN_ZERO_DIGIT_ = '0';


/**
 * A grouping separator character.
 * @type {string}
 * @private
 */
goog.i18n.NumberFormat.PATTERN_GROUPING_SEPARATOR_ = ',';


/**
 * A decimal separator character.
 * @type {string}
 * @private
 */
goog.i18n.NumberFormat.PATTERN_DECIMAL_SEPARATOR_ = '.';


/**
 * A per mille character.
 * @type {string}
 * @private
 */
goog.i18n.NumberFormat.PATTERN_PER_MILLE_ = '\u2030';


/**
 * A percent character.
 * @type {string}
 * @private
 */
goog.i18n.NumberFormat.PATTERN_PERCENT_ = '%';


/**
 * A digit character.
 * @type {string}
 * @private
 */
goog.i18n.NumberFormat.PATTERN_DIGIT_ = '#';


/**
 * A separator character.
 * @type {string}
 * @private
 */
goog.i18n.NumberFormat.PATTERN_SEPARATOR_ = ';';


/**
 * An exponent character.
 * @type {string}
 * @private
 */
goog.i18n.NumberFormat.PATTERN_EXPONENT_ = 'E';


/**
 * A minus character.
 * @type {string}
 * @private
 */
goog.i18n.NumberFormat.PATTERN_MINUS_ = '-';


/**
 * A quote character.
 * @type {string}
 * @private
 */
goog.i18n.NumberFormat.PATTERN_CURRENCY_SIGN_ = '\u00A4';


/**
 * A quote character.
 * @type {string}
 * @private
 */
goog.i18n.NumberFormat.QUOTE_ = '\'';


/**
 * Parses affix part of pattern.
 *
 * @param {string} pattern Pattern string that need to be parsed.
 * @param {Array.<number>} pos One element position array to set and receive
 *     parsing position.
 *
 * @return {string} Affix received from parsing.
 * @private
 */
goog.i18n.NumberFormat.prototype.parseAffix_ = function(pattern, pos) {
  var affix = '';
  var inQuote = false;
  var len = pattern.length;

  for (; pos[0] < len; pos[0]++) {
    var ch = pattern.charAt(pos[0]);
    if (ch == goog.i18n.NumberFormat.QUOTE_) {
      if (pos[0] + 1 < len &&
          pattern.charAt(pos[0] + 1) == goog.i18n.NumberFormat.QUOTE_) {
        pos[0]++;
        affix += '\''; // 'don''t'
      } else {
        inQuote = !inQuote;
      }
      continue;
    }

    if (inQuote) {
      affix += ch;
    } else {
      switch (ch) {
        case goog.i18n.NumberFormat.PATTERN_DIGIT_:
        case goog.i18n.NumberFormat.PATTERN_ZERO_DIGIT_:
        case goog.i18n.NumberFormat.PATTERN_GROUPING_SEPARATOR_:
        case goog.i18n.NumberFormat.PATTERN_DECIMAL_SEPARATOR_:
        case goog.i18n.NumberFormat.PATTERN_SEPARATOR_:
          return affix;
        case goog.i18n.NumberFormat.PATTERN_CURRENCY_SIGN_:
          if ((pos[0] + 1) < len &&
              pattern.charAt(pos[0] + 1) ==
              goog.i18n.NumberFormat.PATTERN_CURRENCY_SIGN_) {
            pos[0]++;
            affix += this.intlCurrencyCode_;
          } else {
            affix += this.currencySymbol_;
          }
          break;
        case goog.i18n.NumberFormat.PATTERN_PERCENT_:
          if (this.multiplier_ != 1) {
            throw Error('Too many percent/permill');
          }
          this.multiplier_ = 100;
          affix += goog.i18n.NumberFormatSymbols.PERCENT;
          break;
        case goog.i18n.NumberFormat.PATTERN_PER_MILLE_:
          if (this.multiplier_ != 1) {
            throw Error('Too many percent/permill');
          }
          this.multiplier_ = 1000;
          affix += goog.i18n.NumberFormatSymbols.PERMILL;
          break;
        default:
          affix += ch;
      }
    }
  }

  return affix;
};


/**
 * Parses the trunk part of a pattern.
 *
 * @param {string} pattern Pattern string that need to be parsed.
 * @param {Array.<number>} pos One element position array to set and receive
 *     parsing position.
 * @private
 */
goog.i18n.NumberFormat.prototype.parseTrunk_ = function(pattern, pos) {
  var decimalPos = -1;
  var digitLeftCount = 0;
  var zeroDigitCount = 0;
  var digitRightCount = 0;
  var groupingCount = -1;

  var len = pattern.length;
  for (var loop = true; pos[0] < len && loop; pos[0]++) {
    var ch = pattern.charAt(pos[0]);
    switch (ch) {
      case goog.i18n.NumberFormat.PATTERN_DIGIT_:
        if (zeroDigitCount > 0) {
          digitRightCount++;
        } else {
          digitLeftCount++;
        }
        if (groupingCount >= 0 && decimalPos < 0) {
          groupingCount++;
        }
        break;
      case goog.i18n.NumberFormat.PATTERN_ZERO_DIGIT_:
        if (digitRightCount > 0) {
          throw Error('Unexpected "0" in pattern "' + pattern + '"');
        }
        zeroDigitCount++;
        if (groupingCount >= 0 && decimalPos < 0) {
          groupingCount++;
        }
        break;
      case goog.i18n.NumberFormat.PATTERN_GROUPING_SEPARATOR_:
        groupingCount = 0;
        break;
      case goog.i18n.NumberFormat.PATTERN_DECIMAL_SEPARATOR_:
        if (decimalPos >= 0) {
          throw Error('Multiple decimal separators in pattern "' +
                      pattern + '"');
        }
        decimalPos = digitLeftCount + zeroDigitCount + digitRightCount;
        break;
      case goog.i18n.NumberFormat.PATTERN_EXPONENT_:
        if (this.useExponentialNotation_) {
          throw Error('Multiple exponential symbols in pattern "' +
                      pattern + '"');
        }
        this.useExponentialNotation_ = true;
        this.minExponentDigits_ = 0;

        // Use lookahead to parse out the exponential part
        // of the pattern, then jump into phase 2.
        while ((pos[0] + 1) < len && pattern.charAt(pos[0] + 1) ==
               goog.i18n.NumberFormat.PATTERN_ZERO_DIGIT_) {
          pos[0]++;
          this.minExponentDigits_++;
        }

        if ((digitLeftCount + zeroDigitCount) < 1 ||
            this.minExponentDigits_ < 1) {
          throw Error('Malformed exponential pattern "' + pattern + '"');
        }
        loop = false;
        break;
      default:
        pos[0]--;
        loop = false;
        break;
    }
  }

  if (zeroDigitCount == 0 && digitLeftCount > 0 && decimalPos >= 0) {
    // Handle '###.###' and '###.' and '.###'
    var n = decimalPos;
    if (n == 0) { // Handle '.###'
      n++;
    }
    digitRightCount = digitLeftCount - n;
    digitLeftCount = n - 1;
    zeroDigitCount = 1;
  }

  // Do syntax checking on the digits.
  if (decimalPos < 0 && digitRightCount > 0 ||
       decimalPos >= 0 && (decimalPos < digitLeftCount ||
                           decimalPos > digitLeftCount + zeroDigitCount) ||
       groupingCount == 0) {
    throw Error('Malformed pattern "' + pattern + '"');
  }
  var totalDigits = digitLeftCount + zeroDigitCount + digitRightCount;

  this.maximumFractionDigits_ = decimalPos >= 0 ? totalDigits - decimalPos : 0;
  if (decimalPos >= 0) {
    this.minimumFractionDigits_ = digitLeftCount + zeroDigitCount - decimalPos;
    if (this.minimumFractionDigits_ < 0) {
      this.minimumFractionDigits_ = 0;
    }
  }

  // The effectiveDecimalPos is the position the decimal is at or would be at
  // if there is no decimal. Note that if decimalPos<0, then digitTotalCount ==
  // digitLeftCount + zeroDigitCount.
  var effectiveDecimalPos = decimalPos >= 0 ? decimalPos : totalDigits;
  this.minimumIntegerDigits_ = effectiveDecimalPos - digitLeftCount;
  if (this.useExponentialNotation_) {
    this.maximumIntegerDigits_ = digitLeftCount + this.minimumIntegerDigits_;

    // in exponential display, we need to at least show something.
    if (this.maximumFractionDigits_ == 0 && this.minimumIntegerDigits_ == 0) {
      this.minimumIntegerDigits_ = 1;
    }
  }

  this.groupingSize_ = Math.max(0, groupingCount);
  this.decimalSeparatorAlwaysShown_ = decimalPos == 0 ||
                                      decimalPos == totalDigits;
};

// Input 4
goog.require("goog.i18n.NumberFormat");
