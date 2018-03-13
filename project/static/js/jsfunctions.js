function MM_swapImgRestore() { //v3.0
  var i,x,a=document.MM_sr; for(i=0;a&&i<a.length&&(x=a[i])&&x.oSrc;i++) x.src=x.oSrc;
}

function MM_preloadImages() { //v3.0
  var d=document; if(d.images){ if(!d.MM_p) d.MM_p=new Array();
    var i,j=d.MM_p.length,a=MM_preloadImages.arguments; for(i=0; i<a.length; i++)
    if (a[i].indexOf("#")!=0){ d.MM_p[j]=new Image; d.MM_p[j++].src=a[i];}}
}

function MM_findObj(n, d) { //v4.01
  var p,i,x;  if(!d) d=document; if((p=n.indexOf("?"))>0&&parent.frames.length) {
    d=parent.frames[n.substring(p+1)].document; n=n.substring(0,p);}
  if(!(x=d[n])&&d.all) x=d.all[n]; for (i=0;!x&&i<d.forms.length;i++) x=d.forms[i][n];
  for(i=0;!x&&d.layers&&i<d.layers.length;i++) x=MM_findObj(n,d.layers[i].document);
  if(!x && d.getElementById) x=d.getElementById(n); return x;
}

function MM_swapImage() { //v3.0
  var i,j=0,x,a=MM_swapImage.arguments; document.MM_sr=new Array; for(i=0;i<(a.length-2);i+=3)
   if ((x=MM_findObj(a[i]))!=null){document.MM_sr[j++]=x; if(!x.oSrc) x.oSrc=x.src; x.src=a[i+2];}
}

function linebreakToHTML(str) {
	return str.replace(new RegExp("\\n", "g"), "<br />");
}

function HTMLToLinebreak(str) {
	return str.replace(new RegExp("<br />", "g"), String.fromCharCode(10));
}

/* Set up a jQuery-based "MouseOver" hover effect on an ID */
function createMouseOver(id, mouseOverSRC) {
	if (
		(typeof(id) == "string") && (id != "")
		&& (typeof(mouseOverSRC) == "string") && (mouseOverSRC != "")
	) {
		/* Incoming id and mouseOverSRC are strings, continue */

		/* Make sure the id has a beginning hash symbol */
		if (id.substr(0, 1) != "#") {
			id = "#" + id;
		}

		var element = $(id);
		if (element.length > 0) {
			/* The element exists in the document, continue */

			if (typeof($(element).attr("src")) == "string") {
				/* The element has a src attribute, continue */

				var originalSRC = $(element).attr("src");
				$(element).hover(
					function() {
						$(this).attr("src", mouseOverSRC);
					}
					,function() {
						$(this).attr("src", originalSRC);
					}
				);
			}
		}
	}
}


/*This function returns an object of the current URL broken down*/
function urlObject(options) {
	"use strict";
	/*global window, document*/

	var url_search_arr,
		option_key,
		i,
		urlObj,
		get_param,
		key,
		val,
		url_query,
		url_get_params = {},
		a = document.createElement('a'),
		default_options = {
			'url': window.location.href,
			'unescape': true,
			'convert_num': true,
			'ses':true
		};

	if (typeof options !== "object") {
		options = default_options;
	} else {
		for (option_key in default_options) {
			if (default_options.hasOwnProperty(option_key)) {
				if (options[option_key] === undefined) {
					options[option_key] = default_options[option_key];
				}
			}
		}
	}

	a.href = options.url;
	url_query = a.search.substring(1);
	
	if ( options.ses == false ){
		var queryString = '?'; 
		url_search_arr = url_query.split('&');
		var newPath = '';
	
		if (url_search_arr[0].length > 1) {
			for (i = 0; i < url_search_arr.length; i += 1) {
				get_param = url_search_arr[i].split("=");
	
				if (options.unescape) {
					key = decodeURI(get_param[0]);
					val = decodeURI(get_param[1]);
				} else {
					key = get_param[0];
					val = get_param[1];
				}
	
				if (options.convert_num) {
					if (val.match(/^\d+$/)) {
						val = parseInt(val, 10);
					} else if (val.match(/^\d+\.\d+$/)) {
						val = parseFloat(val);
					}
				}
	
				if (url_get_params[key] === undefined) {
					url_get_params[key] = val;
				} else if (typeof url_get_params[key] === "string") {
					url_get_params[key] = [url_get_params[key], val];
				} else {
					url_get_params[key].push(val);
				}

				queryString = queryString + '&' +  key + '=' + val;
	
				//get_param = [];
			}
		}	
	} else {
		url_search_arr = options.url.split('index.cfm/');
		var newPath = url_search_arr[0] + 'index.cfm';
		var queryString = '';
		
		//SES -- parse out every other "/"
		if (url_search_arr[1].length >= 1) {
			get_param = url_search_arr[1].split("/");
			for( var i=0; i < get_param.length; i+=2 ){
				
				if (options.unescape) {
					key = decodeURI(get_param[i]);
					val = decodeURI(get_param[i+1]);
				} else {
					key = get_param[i];
					val = get_param[i+1];
				}
				
				if (options.convert_num) {
					if (val.match(/^\d+$/)) {
						val = parseInt(val, 10);
					} else if (val.match(/^\d+\.\d+$/)) {
						val = parseFloat(val);
					}
				}
	
				if (url_get_params[key] === undefined) {
					url_get_params[key] = val;
				} else if (typeof url_get_params[key] === "string") {
					url_get_params[key] = [url_get_params[key], val];
				} else {
					url_get_params[key].push(val);
				}
				
				queryString = queryString + '/' + key + '/' + val ;
			}	
		}
	} 	
	
	var pathname=  (newPath == '' ? a.pathname : newPath),

	urlObj = {
		protocol: a.protocol,
		hostname: a.hostname,
		host: a.host,
		port: a.port,
		hash: a.hash.substr(1),
		pathname: pathname,
		search: a.search,
		parameters: url_get_params,
		queryString: queryString,
		url: pathname + queryString
	};

	return urlObj;
}
