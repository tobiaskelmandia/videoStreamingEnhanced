// ==UserScript==
// @name				Video Streaming Enhanced
// @namespace			http://codingtoby.com
// @version				0.5.1.1
// @description			Improves streaming video by replacing other players with Flowplayer, and adding a variety of configuration options.
// @author				Toby
// @include				https://kissanime.to/Anime/*/*
// @include				http://www.pornhub.com/*
// @include 			http://www.xvideos.com/video*
// @include				http://gorillavid.in/*
// @include				https://flowplayer.org/standalone/commercial.html
// @include				http://vse.codingtoby.com/
// @require				https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @require				https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.js
// @require				http://js.codingtoby.com/tusl.js?updated=00006
// @grant				unsafeWindow
// @grant				GM_getValue
// @grant				GM_setValue
// @grant				GM_deleteValue
// @grant				GM_setClipboard
// @grant				GM_xmlhttpRequest
// @run-at				document-start
// ==/UserScript==

/****************************************************************************************************
 * @require explanations
 * tusl.js - Toby's UserScript Library. Contains my most commonly used utility functions.
 *
 * @grant explanations
 * unsafeWindow - Required to use Flowplayer commercial.
 * GM_getValue, GM_setValue, GM_deleteValue - Required when working with frames.
 * GM_xmlhttpRequest - Required for determining mime types of files for Flowplayer.
 *****************************************************************************************************/


(function (w)
{
	var vse =
		{
			name    : GM_info[ "script" ][ "name" ],
			version : GM_info[ "script" ][ "version" ],
			user    : {},
			status  : {},
			video   : {},
			player  : {}
		};

	// Supported domains that VSE will run on.
	vse.domains =
	{
		kissAnime  : "kissanime.to",
		pornhub    : "pornhub.com",
		xvideos    : "xvideos.com",
		gorillavid : "gorillavid.in",
		vseCustom  : "codingtoby.com"
	};

	// Location of the new player.
	vse.flowplayer = "https://flowplayer.org/standalone/commercial.html";

	var jqui   = '<link rel="stylesheet" href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/themes/smoothness/jquery-ui.css">';
	var fbgrid = '<link rel="stylesheet" href="//cdn.jsdelivr.net/flexboxgrid/6.3.0/flexboxgrid.min.css" type="text/css" >';

	if ( !GM_getValue( "vse_settings" ) )
	{
		vse.user.config                    = {};
		vse.user.config.autoplay           = false;
		vse.user.config.launch             = false;
		vse.user.config.jumpForwardLength  = 90;
		vse.user.config.jumpBackwardLength = 90;
		vse.user.config.skipForwardLength  = 5;
		vse.user.config.skipBackwardLength = 5;
		GM_setValue( "vse_settings", JSON.stringify( vse.user.config ) );
	}
	$.merge( vse.user, JSON.parse( GM_getValue( "vse_settings" ) ) );
	console.log( vse.user );

	vse.fn =
	{
		getElementProperties : function (selector)
		{
			var element =
				{
					height : $( selector ).height(),
					width  : $( selector ).width()
				};
			return element;
		},
		injectPlayer         : function (container)
		{
			var style = "height: " + vse.flowplayerProperties.height + "px; ";
			style     = style + "width: " + vse.flowplayerProperties.width + "px; ";
			$( container ).append( "<div id='vse_iframe_container' style='" + style + "'></div>" );
			$( "#vse_iframe_container" ).append( '<iframe id="vse_fp_iframe" name="vse_fp_iframe_' + Math.random()
												 + '" src="https://flowplayer.org/standalone/commercial.html" frameborder="0" allowfullscreen="true" scrolling="no" height="100%" width="100%"></iframe>' );
			$( "#vse_fp_iframe" ).prop( "style", "max-width:100%; max-height:100%; width:100%; height:100%; padding:0px; margin:0px; background-color:#000000;" );
		},
		launchPlayer         : function ()
		{
			var html            = $( "#vse_iframe_container" ).html();
			var h               = vse.flowplayerProperties.height;
			var w               = vse.flowplayerProperties.width;
			var vsePlayerWindow = window.open( "", "vse_fp_playerWindow_" + Math.random(),
				"menubar=false, toolbar=false, height=" + h + ", width=" + w + "" );
			var favicon = 'data:image/png;base64,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';
			vsePlayerWindow.document.write( html );
			$( vsePlayerWindow.document ).find( "head" )
										 .append( "<style></style><title></title>" )
										 .append('<link rel="icon" type="image/png" href="'+favicon+'">');

			$( vsePlayerWindow.document ).find( "style" ).append( " body { max-width:100%; max-height:100%; width:100%; height:100%; padding:0px; margin:0px; background-color:#000000; } " );
			$( vsePlayerWindow.document ).find( "style" ).append( " #fpFrame { max-width:100%; max-height:100%; width:100%; height:100%; padding:0px; margin:0px; position:absolute; bottom:0px; right:0px; } " );
			$( vsePlayerWindow.document ).find( "title" ).text( vse.video.title );
			$( "#vse_iframe_container" ).html( "" );
		},
		getSite              : function ()
		{
			var userCL = tusl.location.tld();
			for (var key in vse.domains)
			{
				if ( vse.domains.hasOwnProperty( key ) )
				{
					var obj = vse.domains[ key ];
					if ( userCL.indexOf( obj ) != -1 )
					{
						vse.on = key;
					}
				}
			}
		},
		updateConfig         : function ()
		{
			GM_setValue( "vse_settings", JSON.stringify( vse.user.config ) );
		},
		getMimeType          : function (url)
		{
			var dfd = jQuery.Deferred();
			console.log("Retrieving mime-type for: ");
			console.log(url);
			GM_xmlhttpRequest(
				{
					url    : url,
					method : "HEAD",
					onload : function (response)
					{
						var headers  = response.responseHeaders;
						console.log(headers);
						var mimetype = "";
						headers      = headers.split( "\r\n" );
						headers.forEach( function (currentValue, index, array)
						{
							if ( (currentValue.indexOf( "Content-Type:" ) != -1) || (currentValue.indexOf( "content-type:" != -1 )) )
							{
								vse.video.type = currentValue.split( ": " )[ 1 ];
								console.log( vse.video.type );
								dfd.resolve();
							}
						} );
					}
				} );
			return dfd.promise();
		},
		launchConfig         : function ()
		{
			var isOpen = $( "#vse_config_modal" ).dialog( "isOpen" );
			if ( isOpen )
			{
				$( "#vse_config_modal" ).dialog( "close" );
			}
			else
			{
				$( "#vse_config_modal" ).dialog( "open" );
				if ( vse.user.config.autoplay )
				{
					$( "#vse_config_autoplay" ).prop( "checked", true );
				}
				else
				{
					$( "#vse_config_autoplay" ).prop( "checked", false );
				}
				if ( vse.user.config.launch )
				{
					$( "#vse_config_launch" ).prop( "checked", true );
				}
				else
				{
					$( "#vse_config_launch" ).prop( "checked", false );
				}
				$( "#vse_config_skipForwardLength" ).val( vse.user.config.skipForwardLength );
				$( "#vse_config_skipBackwardLength" ).val( vse.user.config.skipBackwardLength );
				$( "#vse_config_jumpForwardLength" ).val( vse.user.config.jumpForwardLength );
				$( "#vse_config_jumpBackwardLength" ).val( vse.user.config.jumpBackwardLength );
			}
		},
		prepConfig           : function ()
		{
			// Add jQueryUI stylesheet to the document head.
			$( "head" ).append( jqui );
			// Add Flexbox Grid stylesheet to the document head.
			$( "head" ).append( fbgrid );

			// Create basic VSE config window structure.
			$( "body" ).append( '<div id="vse_config_modal" title="Video Streaming Enhanced"></div>' );
			$( "#vse_config_modal" ).append( '<div id="vse_config_tabs"></div>' );
			$( "#vse_config_tabs" ).append( '<ul id="vse_config_tabsUL"></ul>' );
			$( "#vse_config_tabsUL" ).append( '<li><a href="#vse_config_playerSettings">Player Settings</a></li>' );
			$( "#vse_config_tabsUL" ).append( '<li><a href="#vse_config_supportedSites">Supported Sites</a></li>' );
			$( "#vse_config_tabsUL" ).append( '<li><a href="#vse_config_about">About</a></li>' );
			$( "#vse_config_tabs" ).append( '<div id="vse_config_playerSettings"></div>' );
			$( "#vse_config_tabs" ).append( '<div id="vse_config_supportedSites"></div>' );
			$( "#vse_config_tabs" ).append( '<div id="vse_config_about"></div>' );

			// Player Settings
			$( "#vse_config_playerSettings" ).append( '<div class="row"><div class="col-xs-5">Autoplay: </div><div class="col-xs-7"><input name="vse_config_autoplay" id="vse_config_autoplay" type="checkbox"></div></div>' );
			$( "#vse_config_playerSettings" ).append( '<div class="row"><div class="col-xs-5">Launch player in new window: </div><div class="col-xs-7"><input name="vse_config_launch" id="vse_config_launch" type="checkbox"></div></div>' );
			$( "#vse_config_playerSettings" ).append( '<div class="row"><div class="col-xs-5">Skip Forward Length: </div><div class="col-xs-7"><input name="vse_config_skipForwardLength" value="" id="vse_config_skipForwardLength" type="text"> seconds</div></div>' );
			$( "#vse_config_playerSettings" ).append( '<div class="row"><div class="col-xs-5">Skip Backward Length: </div><div class="col-xs-7"><input name="vse_config_skipBackwardLength" value="" id="vse_config_skipBackwardLength" type="text"> seconds</div></div>' );
			$( "#vse_config_playerSettings" ).append( '<div class="row"><div class="col-xs-5">Jump Forward Length: </div><div class="col-xs-7"><input name="vse_config_jumpForwardLength" value="" id="vse_config_jumpForwardLength" type="text"> seconds</div></div>' );
			$( "#vse_config_playerSettings" ).append( '<div class="row"><div class="col-xs-5">Jump Backward Length: </div><div class="col-xs-7"><input name="vse_config_jumpBackwardLength" value="" id="vse_config_jumpBackwardLength" type="text"> seconds</div></div>' );
			$( "#vse_config_playerSettings" ).append( '<br /><br />' );
			$( "#vse_config_playerSettings" ).append( '<input id="vse_config_save" type="button" value="Save"> ' );
			$( "#vse_config_playerSettings" ).append( '<input id="vse_config_cancel" type="button" value="Cancel"> ' );

			// Supported Sites
			$( "#vse_config_supportedSites" ).append( "KissAnime.to<br />" );
			$( "#vse_config_supportedSites" ).append( "PornHub.com<br />" );
			$( "#vse_config_supportedSites" ).append( "GorillaVid.in<br />" );
			$( "#vse_config_supportedSites" ).append( "XVideos.com (Launched Player Only)<br />" );
			$( "#vse_config_supportedSites" ).append( "vse.codingtoby.com (Choose the URL of a video file to stream.)<br />" );
			$( "#vse_config_supportedSites" ).append( "<br /><br />" );
			$( "#vse_config_supportedSites" ).append( "Support for new sites can be added on demand." );

			// About
			$( "#vse_config_about" ).append( '<span style="font-size: 2em;">Video Streaming Enhanced</span><br /><br />' );
			$( "#vse_config_about" ).append( '<strong>Version:</strong> ' + vse.version + "<br />" );
			$( "#vse_config_about" ).append( '<strong>Author:</strong> <a href="http://codingtoby.com" target="_blank" style="color:#6666ff">Toby</a><br />' );
			$( "#vse_config_about" ).append( '<strong>Updates:</strong> <a href="https://openuserjs.org/scripts/Tobias.Kelmandia/Video_Streaming_Enhanced" target="_blank" style="color:#6666ff">OpenUserJS</a><br />' );
			$( "#vse_config_about" ).append( '<strong>Other Links:</strong>' );
			$( "#vse_config_about" ).append( '<ul>' );
			$( "#vse_config_about" ).append( '<li><a href="http://codingtoby.com/category/userscripts/video-streaming-enhanced/vse-updates/" target="_blank" style="color:#6666ff">Changelog</a></li>' );
			$( "#vse_config_about" ).append( '<li><a href="https://github.com/tobiaskelmandia/videoStreamingEnhanced" target="_blank" style="color:#6666ff">Github</a></li>' );
			$( "#vse_config_about" ).append( '</ul>' );

			// Make sure the seek lengths are numerical.
			function validateNumber(id)
			{
				var str = $( "#" + id ).val();
				if ( /^\s*\d+\s*$/.test( str ) )
				{
					// Everything's fine.
				}
				else if ( str == "" )
				{
					$( "#" + id ).val( "0" );
				}
				else
				{
					var trueName = id.replace( "vse_config_", "" );
					$( "#" + id ).val( vse.user.config[ trueName ] );
				}
			}

			$( '#vse_config_skipForwardLength' ).keyup( function ()
			{
				validateNumber( "vse_config_skipForwardLength" )
			} );
			$( '#vse_config_skipBackwardLength' ).keyup( function ()
			{
				validateNumber( "vse_config_skipBackwardLength" )
			} );
			$( '#vse_config_jumpForwardLength' ).keyup( function ()
			{
				validateNumber( "vse_config_jumpForwardLength" )
			} );
			$( '#vse_config_jumpBackwardLength' ).keyup( function ()
			{
				validateNumber( "vse_config_jumpBackwardLength" )
			} );

			vse.status.winWidth  = parseInt( $( w ).width() );
			vse.status.winHeight = parseInt( $( w ).height() );

			// Initialize modal.
			$( "#vse_config_modal" ).dialog( {
				autoOpen  : false,
				modal     : true,
				width     : vse.status.winWidth - 20,
				height    : vse.status.winHeight - 20,
				resizable : false,
				draggable : false
			} );

			// Initialize tabs.
			$( function ()
			{
				$( "#vse_config_tabs" ).tabs();
			} );

			// Resize the modal when the window is resized.
			$( window ).resize( function ()
			{
				vse.status.winWidth  = parseInt( $( w ).width() );
				vse.status.winHeight = parseInt( $( w ).height() );

				$( ".ui-dialog" ).css( "width", vse.status.winWidth - 20 );
				$( ".ui-dialog" ).css( "height", vse.status.winHeight - 20 );
			} );

			// Buttons
			$( "#vse_config_save" ).click( function ()
			{
				if ( $( "#vse_config_autoplay" ).prop( "checked" ) )
				{
					vse.user.config.autoplay = true;
				}
				else
				{
					vse.user.config.autoplay = false;
				}
				if ( $( "#vse_config_launch" ).prop( "checked" ) )
				{
					vse.user.config.launch = true;
				}
				else
				{
					vse.user.config.launch = false;
				}

				vse.user.config.skipForwardLength  = parseInt( $( "#vse_config_skipForwardLength" ).val() );
				vse.user.config.skipBackwardLength = parseInt( $( "#vse_config_skipBackwardLength" ).val() );
				vse.user.config.jumpForwardLength  = parseInt( $( "#vse_config_jumpForwardLength" ).val() );
				vse.user.config.jumpBackwardLength = parseInt( $( "#vse_config_jumpBackwardLength" ).val() );

				vse.fn.updateConfig();

				$( "#vse_config_modal" ).dialog( "close" );
			} );

			$( "#vse_config_cancel" ).click( function ()
			{
				$( "#vse_config_modal" ).dialog( "close" );
			} );
		}
	};


	vse.fn.siteSpecific =
	{
		kissAnime  : {
			cleanupLayout : function ()
			{
				var iframeIDList            = [],
					vse_hiddenCSS           = "height:1px; width:1px; bottom:0; right:0; background-color:black;",
					vse_hidden_containerCSS = "bottom:0px; right:0px; height:2px; width:100%;";
				$( document ).ready( function ()
				{
					$( "body" ).css( "overflow-x", "hidden" );
					$( "head" ).append( "<style id='vse_style'></style>" );
					$( "#vse_style" ).append( ".vse_hidden { " + vse_hiddenCSS + " }" );
					$( "#vse_style" ).append( ".vse_hidden_container { " + vse_hidden_containerCSS + " }" );
					$( "label.lbl" ).each( function ()
					{
						var lbltxt = $( this ).text();
						lbltxt     = lbltxt.trim();
						$( this ).text( lbltxt );
					} );

					// Allow AdBlock to run on KissAnime. (Fools detection.)
					$( "iframe" ).each( function ()
					{
						var tempID = $( this ).prop( "id" );
						iframeIDList.push( tempID );
					} );

					$( "body" ).append( "<div id='vse_hidden_container'></div>" );
					iframeIDList.forEach( function (currentValue, index, array)
					{
						$( "#" + currentValue ).remove();
						$( "#vse_hidden_container" ).append( "<div id='" + currentValue + "' class='vse_hidden'>&nbsp;.&nbsp;</div>" );
					} );

					if ( !$( '#adsIfrme10' ).is( ":visible" ) )
					{
						console.log( "Problem!" );
					}
					else
					{
						console.log( "No problem!" );
					}

					// Remove extraneous elements that crowd the page.
					$( "#container" ).find( ".clear" ).each( function ()
					{
						$( this ).remove();
					} );
					$( "#container" ).find( ".clear2" ).each( function ()
					{
						$( this ).remove();
					} );
					$( ".divCloseBut" ).each( function ()
					{
						$( this ).remove();
					} );

					setTimeout( function ()
					{
						unsafeWindow.isBlockAds2 = false;
						console.log( "Setting isBlockAds2 = false" );
					}, 45000 );

					// Scroll to the player area.
					var scrollTo = $( "#selectEpisode" ).offset().top;
					$( 'html, body' ).animate( {scrollTop : scrollTo}, 300 );
				} );

				$( w ).load( function ()
				{
					$( "iframe" ).each( function ()
					{
						if ( $( this ).attr( "id" ) != "vse_fp_iframe" )
						{
							$( this ).remove();
						}
					} );
				} );
			},
			getVideoURL   : function ()
			{
				var video_URL = $( "#my_video_1_html5_api" ).prop( "src" );
				var qualArr   = [];
				$( '#selectQuality' ).children().each( function ()
				{
					qualArr.push( $( this ).val() );
				} );
				var srcArr = [];

				qualArr.forEach( function (currentValue, index, array)
				{
					srcArr.push( unsafeWindow.asp.wrap( currentValue ) );
				} );
				console.log( srcArr );
				//var testvar = unsafeWindow.asp.wrap();

				return video_URL;
			},
			init          : function ()
			{
				console.log( "Running on KissAnime." );
				$( document ).ready( $.proxy( function ()
				{
					this.cleanupLayout();
					vse.video.url   = this.getVideoURL();
					var videoTitle  = $( "title" ).text();
					videoTitle      = tusl.replaceAll( videoTitle, "\n", "" );
					videoTitle      = videoTitle.split( " - Watch " )[ 0 ];
					videoTitle      = videoTitle.replace( /\s\s+/g, ' ' );
					videoTitle      = videoTitle.trim();
					vse.video.title = videoTitle;


					vse.flowplayerProperties = vse.fn.getElementProperties( "#my_video_1_html5_api" );
					var oldContainer         = $( "#divContentVideo" ).children()[ 0 ];
					$( oldContainer ).remove();


					$.when( vse.fn.getMimeType( vse.video.url ) ).then( function ()
					{
						GM_setValue( "vse_videoInfo", JSON.stringify( vse.video ) );
						console.log( GM_getValue( "vse_videoInfo" ) );


						vse.fn.injectPlayer( "#divContentVideo" );
						$( "#centerDivVideo" ).css( "margin-top", "10px" );
						$( "#centerDivVideo" ).css( "margin-bottom", "10px" );

						if ( vse.user.config.launch )
						{
							vse.fn.launchPlayer();
						}
					} );
				}, this ) );
			}
		},
		pornhub    : {
			cleanupLayout : function ()
			{
				var here = w.location.href;
				$( document ).ready( function ()
				{
					$( "#PornhubNetworkBar" ).hide();

					$( "#welcome" ).remove();

					$( "p.footer" ).remove();
					$( ".footer-title" ).remove();

					$( "section#footer" ).remove();
					$( ".logoFooterWrapper" ).remove();

					$( "#header" ).css( "padding-bottom", "5px" );

					if ( (here.indexOf( "video/" ) != -1) || (here == "http://www.pornhub.com/video") )
					{
						var hardcoreVidsFromFriends = $( "h2:contains('Hardcore Videos from Our Friends')" ).parent().parent()[ 0 ];
						$( hardcoreVidsFromFriends ).remove();

						var popPhotoResults = $( "h2:contains('Popular Photos Results')" ).parent().parent()[ 0 ];
						$( popPhotoResults ).remove();

						var relatedSearch = $( "h2:contains('Searches Related to')" ).parent().parent()[ 0 ];
						$( relatedSearch ).remove();

						var ps = $( ".section_title:contains('Pornstars')" ).parent();
						$( ps ).next().hide();
						$( ps ).hide();

						var pagination = $( ".pagination3" )[ 0 ];
						$( pagination ).find( "a" ).each( function ()
						{
							var thisLink = $( this ).prop( "href" );
							thisLink     = tusl.replaceAll( thisLink, "++", "+%2b" );
							thisLink     = tusl.replaceAll( thisLink, "=+", "=%2b" );
							$( this ).prop( "href", thisLink );
						} );
						$( pagination ).css( {position : "relative", float : "right"} );
						var pagi = $( ".pagination3" ).prop( "outerHTML" );
						$( ".nf-videos" ).find( ".sectionWrapper" ).after().append( pagi );
						$( pagination ).remove();

						$( "head" ).append( "<style>.nf-videos { width: calc(100% - 220px) !important; } </style>" );
					}
					else if ( here.indexOf( "view_video.php?viewkey=" ) != -1 )
					{
						$( "#hd-rightColVideoPage" ).children().each( function ()
						{
							if ( !($( this ).hasClass( "section-relateds" )) && !($( this ).hasClass( "reset" )) )
							{
								$( this ).remove();
							}
						} );
						$( ".abovePlayer" ).remove();
					}
				} );

				$( w ).load( function ()
				{
					$( "#abAlertClose" ).click();
					var abwl = $( ".adblockWhitelisted" ).parentsUntil( "div" ).each( function ()
					{
						$( this ).remove();
					} );
					$( ".adblockWhitelisted" ).parent().remove();
					$( "figure" ).remove();
					$( "aside" ).remove();
					$( ".noAdsWhiteListed" ).remove();
					$( ".ad-link" ).remove();
					$( ".removeAdLink" ).remove();
				} );

			},
			getVideoURL   : function ()
			{
				var dfd = jQuery.Deferred();
				$( document ).ready( function ()
				{
					var fv = $( document ).find( "script:contains('flashvars')" )[ 0 ];
					fv     = $( fv ).prop( "innerHTML" );
					//console.log(fv);
					var pqarr        = fv.split( "var player_quality_" );
					var pql          = pqarr.length;
					var lastSource   = pqarr[ pql - 1 ];
					pqarr[ pql - 1 ] = lastSource.split( "flashvars_" )[ 0 ];

					var sources = {};

					for (i = 1 ; i < pqarr.length ; i++)
					{
						var srcStr  = pqarr[ i ];
						var src     = srcStr.split( " = " );
						var quality = src[ 0 ];
						var url     = src[ 1 ];

						url = tusl.replaceAll( url, "'", "" );
						url = tusl.replaceAll( url, ";", "" );

						sources[ "q_" + quality ] = url;
					}

					if ( sources.q_720p )
					{
						console.log( "720p: " + sources.q_720p );
						vse.video.url = sources.q_720p;
						dfd.resolve();
					}
					else if ( sources.q_480p )
					{
						console.log( "480p: " + sources.q_480p );
						vse.video.url = sources.q_480p;
						dfd.resolve();
					}
					else if ( sources.q_360p )
					{
						console.log( "360p: " + sources.q_360p );
						vse.video.url = sources.q_360p;
						dfd.resolve();
					}
					else if ( sources.q_240p )
					{
						console.log( "240p: " + sources.q_240p );
						vse.video.url = sources.q_240p;
						dfd.resolve();
					}
				} );
				return dfd.promise();
			},
			init          : function ()
			{
				console.log( "Running on PornHub." );
				$( document ).ready( $.proxy( function ()
				{
					this.cleanupLayout();
					var here = w.location.href;
					if ( here.indexOf( "view_video.php?viewkey=" ) != -1 )
					{
						var videoTitle  = $( "title" ).text();
						videoTitle      = tusl.replaceAll( videoTitle, "\n", "" );
						videoTitle      = videoTitle.split( " - Pornhub.com" )[ 0 ];
						vse.video.title = videoTitle;

						vse.flowplayerProperties = vse.fn.getElementProperties( "#player" );
						var oldContainer         = $( ".playerFlvContainer" );
						$( oldContainer ).remove();

						$.when( this.getVideoURL() ).then( function ()
						{
							$.when( vse.fn.getMimeType( vse.video.url ) ).then( function ()
							{
								GM_setValue( "vse_videoInfo", JSON.stringify( vse.video ) );
								console.log( GM_getValue( "vse_videoInfo" ) );

								vse.fn.injectPlayer( "#player" );

								if ( vse.user.config.launch )
								{
									vse.fn.launchPlayer();
								}
							} );
						} );
					}
				}, this ) );
			}
		},
		xvideos    : {
			getVideoURL : function ()
			{
				var videoEmbed = $( "#player" );
				var vserc      = $( videoEmbed ).html();
				var fs         = vserc.split( "flashvars=\"" )[ 1 ];
				fs             = fs.split( "\"" )[ 0 ];
				var videoURL   = fs.split( "flv_url=" )[ 1 ];
				videoURL       = videoURL.split( "&amp;" )[ 0 ];
				vse.video.url  = decodeURIComponent( videoURL );
			},
			init        : function ()
			{

				console.log( "Running on XVideos." );
				$( document ).ready( $.proxy( function ()
				{
					this.getVideoURL();
					var videoTitle  = $( "title" ).text();
					videoTitle      = tusl.replaceAll( videoTitle, "\n", "" );
					videoTitle      = videoTitle.split( " - XVIDEOS.COM" )[ 0 ];
					vse.video.title = videoTitle;

					vse.flowplayerProperties = vse.fn.getElementProperties( "#player" );

					var oldContainer = $( "#player" );
					$( oldContainer ).remove();
					$( "#content" ).prepend( "<div id='newPlayer'></div>" );


					$.when( vse.fn.getMimeType( vse.video.url ) ).then( function ()
					{
						GM_setValue( "vse_videoInfo", JSON.stringify( vse.video ) );
						console.log( GM_getValue( "vse_videoInfo" ) );

						vse.fn.injectPlayer( "#newPlayer" );

						// CSP prevents inline video, so always launch in a new window.
						vse.fn.launchPlayer();
					} );

				}, this ) );
			}
		},
		gorillavid : {
			getVideoURL : function ()
			{
				// do shit
			},
			prepwork      : function ()
			{
				var dfd = jQuery.Deferred();
				$( document ).ready( function ()
				{
					if ( $( '#btn_download' ).length > 0 )
					{
						for (i = 0 ; i < 100 ; i++)
						{
							window.clearTimeout( i );
						}
						console.log( "Timeouts cleared." );
						var realForm = $( "form" )[ 1 ];
						$( realForm ).attr( "id", "realForm" );
						//console.log($('#btn_download'));
						$( '#btn_download' ).prop( "disabled", false );
						$( '#btn_download' ).val( 'Continue' );
						$( "#realForm" ).submit();
						//$('#btn_download').click();
					}
					else
					{
						jwplayer().onReady( function ()
						{
							// URL of the video file.
							var videoUrl = jwplayer().config.file;
							console.log(jwplayer().config);
							vse.video.url = videoUrl;
							vse.flowplayerProperties = vse.fn.getElementProperties( ".pic-big" );
							vse.video.title = "";
							console.log( "Loading video:" );
							console.log( videoUrl );
							dfd.resolve();
						} );
					}
				} );
				return dfd.promise();
			},
			init        : function ()
			{
				console.log( "Running on GorillaVid." );
				$( document ).ready( $.proxy( function ()
				{
					$.when(this.prepwork()).then($.proxy(function()
					{
						var oldContainer = $( ".pic-big" );
						$( oldContainer ).remove();
						$( ".c1-box" ).prepend( "<div id='newPlayer'></div>" );
						$.when( vse.fn.getMimeType( vse.video.url ) ).then( function ()
						{
							// Parse the video title.
							var temp = $(".tabbertab.tabbertabhide").find("textarea");
							temp = $(temp[1]).prop('outerHTML');
							temp = temp.split("]")[1];
							temp = temp.split("[")[0];
							temp = temp.replace(/(( \- )+([0-9]?\.[0-9]+|[0-9]+)+( MB))/gi,"");
							temp = temp.trim();
							console.log(temp);
							vse.video.title = temp;

							GM_setValue( "vse_videoInfo", JSON.stringify( vse.video ) );
							console.log( GM_getValue( "vse_videoInfo" ) );
							vse.fn.injectPlayer( "#newPlayer" );

							if ( vse.user.config.launch )
							{
								vse.fn.launchPlayer();
							}
						} );
					},this));
				}, this ) );
			}

		},
		vseCustom :
		{
			init : function()
			{
				console.log("Running on: VSE Custom");
				vse.video.title = "";
				vse.flowplayerProperties = vse.fn.getElementProperties( "#playerContainer" );

				$("#loadButton").click(function()
				{
					vse.video.url = $("#videoURL").val();
					vse.video.title = $("#videoTitle").val();
					$("title").text("VSE - " + vse.video.title);


					console.log("Loading: " + vse.video.url);
					$.when( vse.fn.getMimeType( vse.video.url ) ).then( function ()
					{
						GM_setValue( "vse_videoInfo", JSON.stringify( vse.video ) );
						console.log( GM_getValue( "vse_videoInfo" ) );
						vse.fn.injectPlayer( "#playerContainer" );

						if ( vse.user.config.launch )
						{
							vse.fn.launchPlayer();
						}
					} );

				});
			}
		}
	};
	vse.init            = function ()
	{
		if ( GM_getValue( "vse_settings" ) )
		{
			var vse_settings = GM_getValue( "vse_settings" );
			vse.user.config  = JSON.parse( vse_settings );
		}
		$( document ).ready( function ()
		{
			vse.fn.getSite();
			if ( (window.top == window.self) && (w.location.href != vse.flowplayer) )
			{
				vse.fn.siteSpecific[ vse.on ].init();
				vse.fn.prepConfig();
				$( document ).keydown( function (e)
				{
					var metaKeyPressed = e.ctrlKey || e.metaKey || e.altKey,
						key            = e.which;
					if ( !e.shiftKey && !metaKeyPressed )
					{
						switch (key)
						{
							case 192: // Grave accent key will now open the AniLinkz Enhanced config modal.
								vse.fn.launchConfig();
								break;
						}
					}
				} );
			}
			else if ( (window.top == window.self) && (w.location.href == vse.flowplayer) )
			{
				// do nothing
			}
			else
			{
				if ( w.location.href == vse.flowplayer )
				{
					/**************************************************
					 ** Flowplayer Specific
					 **************************************************/
					console.log( "Running on Flowplayer." );

					$( document ).ready( function ()
					{
						if ( GM_getValue( "vse_videoInfo" ) )
						{
							vse.video = JSON.parse( GM_getValue( "vse_videoInfo" ) );
							GM_deleteValue( "vse_videoInfo" );
						}

						var dlName     = encodeURIComponent( vse.video.title ),
							fileFormat = "",
							ap         = "";

						if ( vse.user.config.autoplay )
						{
							ap = " autoplay ";
						}

						if ( vse.video.type == "video/mp4" )
						{
							fileFormat = ".mp4";
						}
						else if ( vse.video.type = "video/flash" )
						{
							unsafeWindow.flowplayer.conf.bgcolor = "#000000";
							fileFormat                           = ".flv";
						}

						// Replace existing body html with injected player.
						$( "body" ).html( '<div id="vsePlayer" class="flowplayer" data-embed="false" data-key="$130763224349944"></div>' );
						$( "#vsePlayer" ).append( '<video data-title="' + vse.video.title + '"' + ap + '><source type="' + vse.video.type + '" src="'
												  + vse.video.url + '"></video>' );


						/**************************************************
						 ** Reskin the stock commercial player.
						 **************************************************/
							// Add google Material Icons webfont. (To fix broken myriad pro icons)
						$( "head" ).append( '<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">' );

						// Adjust material icons class to match the help screen.
						$( "style" ).append( ' .material-icons { font-size: 100% !important; line-height: 1.5  !important; } ' );

						// Basic Styles
						$( "style" ).append( " body { background-color:#000000; margin:0px; padding:0px; height:100%; width:100%; max-height:100%; max-width:100%; } " );
						$( "style" ).append( ' .flowplayer { width:100%; height:100%; max-height:100%; max-width:100%; margin: auto; position: absolute; top: 0; left: 0; bottom: 0; right: 0; } ' );
						$( "style" ).append( ' .flowplayer .fp-controls { background-color: rgba(0, 0, 0, 0.4) } ' );
						$( "style" ).append( ' .flowplayer .fp-timeline { background-color: rgba(46, 46, 46, 1) } ' );
						$( "style" ).append( ' .flowplayer .fp-progress { background-color: rgba(219, 0, 0, 1) } ' );
						$( "style" ).append( ' .flowplayer .fp-buffer { background-color: rgba(249, 249, 249, 1) } ' );
						$( "style" ).append( ' .flowplayer.is-mouseout .fp-ui { cursor: none !important; } ' );

						// Always use a black background for unused screen space.
						$( "style" ).append( ' .flowplayer, .flowplayer.is-fullscreen, .flowplayer.is-fullscreen .fp-player, .flowplayer.is-playing { background-color: #000000; } ' );

						// Enable timeline tooltip
						$( "style" ).append( ' .flowplayer .fp-timeline:hover+.fp-timeline-tooltip { display:block; } ' );
						$( "style" ).append( ' .is-touch.flowplayer .fp-timeline:hover+.fp-timeline-tooltip { display:block; } ' );

						// AniLinkz Enhanced player config.
						$( "style" ).append( ' .vse_config { height:100%; width:100%; background-color: rgba(51,51,51,0.9); left:0px; top:0px; margin:0px; color:#ffffff; position:absolute; } ' );
						$( "style" ).append( ' .vse_config_main { margin-top:6%; padding-left:5%; position:relative; text-align:center; } ' );


						// Move fullscreen button to the bottom right.
						(function ()
						{
							// Make room for the fullscreen button.
							$( "style" ).append( " .flowplayer .fp-duration, .flowplayer .fp-remaining { right:225px; margin-right:45px } " );
							$( "style" ).append( " .flowplayer.is-mouseover .fp-controls { right:50px; } .flowplayer .fp-fullscreen{ top:0; right:-40px; } " );

							flowplayer( function (api, root)
							{
								// at initializiation
								// - remove fullscreen button
								// - add fullscreen button to controlbar

								var fsbutton = document.createElement( "a" ),
									anchors  = root.getElementsByTagName( "a" ),
									divs     = root.getElementsByTagName( "div" ),
									i, elem;

								fsbutton.className = "fp-fullscreen";

								for (i = 0 ; i < anchors.length ; i += 1)
								{
									elem = anchors[ i ];
									if ( elem.className == "fp-fullscreen" )
									{
										elem.parentNode.removeChild( elem );
										break;
									}
								}

								for (i = 0 ; i < divs.length ; i += 1)
								{
									elem = divs[ i ];
									if ( elem.className == "fp-controls" )
									{
										elem.appendChild( fsbutton );
										break;
									}
								}
							} );
						})();


						/**************************************************
						 ** Add the context menu.
						 **************************************************/

						/*
						 $("#vsePlayer").append('<div class="fp-context-menu"><ul id="fpContextMenuList"></ul></div>');
						 $("#fpContextMenuList").append('<li><a id="fpCopyVideoURL" href="javascript:;">Copy Video URL to Clipboard</a></li>');

						 $("#fpCopyVideoURL").click(function ()
						 {
						 GM_setClipboard(vse.video.url);
						 $(".fp-context-menu").css("display", "none");
						 });
						 */

						/**************************************************
						 ** Adjust flowplayer basic config.
						 **************************************************/

							// Remove unnecessary rtmp object.
						delete unsafeWindow.flowplayer.conf.rtmp;

						// Enable fullscreen.
						unsafeWindow.flowplayer.conf.fullscreen = true;

						// Enable adaptive ratio.
						unsafeWindow.flowplayer.conf.adaptiveRatio = true;

						// Initialize injected Flowplayer instance
						var player = unsafeWindow.$( "#vsePlayer" ).flowplayer();

						// Flowplayer API shortcut variable
						var FP = unsafeWindow.$( "#vsePlayer" ).data( "flowplayer" );

						// Wait until the player is ready.
						FP.on( "ready", function ()
						{
							// Focus the player automatically.
							$( "#vsePlayer" ).focus();
							console.log( FP );
							// Enable adaptive ratio.
							unsafeWindow.flowplayer.conf.adaptiveRatio = true;

							// Add double click to fullscreen support.
							$( "#vsePlayer" ).dblclick( function ()
							{
								FP.fullscreen();
							} );
							vse.fn.prepConfig();

							// Reconfigure Hotkeys
							unsafeWindow.$( document ).keydown( function (e)
							{
								var metaKeyPressed = e.ctrlKey || e.metaKey || e.altKey,
									key            = e.which;
								if ( !e.shiftKey && !metaKeyPressed )
								{
									switch (key)
									{
										case 192: // Grave accent key will now open the AniLinkz Enhanced config modal.
											vse.fn.launchConfig();
											break;
										case 39: // Right arrow key will now skip forward by configured length.
											FP.seek( FP.video.time + vse.user.config.skipForwardLength );
											break;
										case 37: // Left arrow key will now skip backwards by configured length.
											FP.seek( FP.video.time - vse.user.config.skipBackwardLength );
											break;

										// Enable original controls to function without hover.
										case 38: // Up Arrow will raise volume.
											FP.volume( FP.volumeLevel + .1 );
											break;
										case 40: // Down Arrow will lower volume.
											FP.volume( FP.volumeLevel - .1 );
											break;
										case 77: // 'm' key will toggle mute.
											FP.mute();
											break;
										case 70: // 'f' key will toggle fullscreen.
											FP.fullscreen();
											break;
										case 32: // Spacebar will toggle play/pause.
											if ( FP.playing )
											{
												FP.pause();
											}
											else
											{
												FP.play();
											}
											break;
										case 81: // 'q' key will unload / stop.
											FP.unload();
											break;
										default:
											return;
									}
								}
								if ( e.ctrlKey )
								{
									switch (key)
									{
										case 39: // CTRL + Right arrow key  will now jump forward by configured length.
											FP.seek( FP.video.time + vse.user.config.jumpForwardLength );
											break;
										case 37: // CTRL + Left arrow key will now jump backwards by configured length.
											FP.seek( FP.video.time - vse.user.config.jumpBackwardLength );
											break;
										default:
											return;
									}
								}
								e.preventDefault();
							} );
							var playerElement = unsafeWindow.document.getElementById( "vsePlayer" );
							// IE9, Chrome, Safari, Opera
							playerElement.addEventListener( "mousewheel", MouseWheelHandler, false );
							// Firefox
							playerElement.addEventListener( "DOMMouseScroll", MouseWheelHandler, false );

							function MouseWheelHandler(e)
							{
								// cross-browser wheel delta
								var e     = window.event || e;
								var delta = Math.max( -1, Math.min( 1, (e.wheelDelta || -e.detail) ) );
								if ( delta == 1 )
								{
									FP.volume( FP.volumeLevel + 0.01 );
								}
								if ( delta == -1 )
								{
									FP.volume( FP.volumeLevel - 0.01 );
								}

								return false;
							}


							var fpscript = $( "head" ).find( "script" );
							var fpsl     = fpscript.length;
							$( fpscript[ fpsl - 1 ] ).remove();
							console.log( fpscript );


							/**************************************************
							 * Help Menu
							 * Fix broken icons in the help menu.
							 * Add new help section.
							 **************************************************/
							$( ".fp-help" ).append( '<div class="fp-help-section"><p></p></div>' );

							var hsObj       = $( ".fp-help-section" ),
								helpSection = {};


							/*  Convenient Help Section Object */
							helpSection.basics = $( hsObj[ 0 ] ).children();
							// $(helpSection.basics[0]) = Play / Pause
							// $(helpSection.basics[1]) = Unload | Stop
							// $(helpSection.basics[2]) = Fullscreen
							// $(helpSection.basics[3]) = Slower / Faster
							helpSection.volume = $( hsObj[ 1 ] ).children();
							// $(helpSection.volume[0]) = Volume
							// $(helpSection.volume[1]) = Mute
							helpSection.seeking = $( hsObj[ 2 ] ).children();
							$( helpSection.seeking[ 0 ] ).remove();
							$( hsObj[ 2 ] ).prepend( "<p></p> <p></p> <br /> <p></p> <p></p> <br />" );
							helpSection.seeking = $( hsObj[ 2 ] ).find( "p" );
							// $(helpSection.seeking[0]) = Skip Backwards
							// $(helpSection.seeking[1]) = Skip Forwards
							// $(helpSection.seeking[2]) = Seek to Previous
							// $(helpSection.seeking[3]) = Seek to %
							helpSection.custom1 = $( hsObj[ 3 ] ).children();
							// $(helpSection.custom1[0]) = Config Menu


							// Fix Icons: Slower / Faster
							$( helpSection.basics[ 3 ] ).html( '<em>shift</em> + <em><i class="material-icons">arrow_back</i></em><em><i class="material-icons">arrow_forward</i></em>slower / faster' );

							// Fix Icons: Volume
							$( helpSection.volume[ 0 ] ).html( '<em><i class="material-icons">arrow_upward</i></em><em><i class="material-icons">arrow_downward</i></em>volume' );

							// Replace: Seek
							$( helpSection.seeking[ 0 ] ).html( '<em><i class="material-icons">arrow_back</i></em>Skip Backwards '
																+ vse.user.config.skipBackwardLength + 's' );
							$( helpSection.seeking[ 1 ] ).html( '<em><i class="material-icons">arrow_forward</i></em>Skip Forwards '
																+ vse.user.config.skipForwardLength + 's' );
							$( helpSection.seeking[ 2 ] ).html( '<em>ctrl</em> + <em><i class="material-icons">arrow_back</i></em>Jump Backwards '
																+ vse.user.config.jumpBackwardLength + 's' );
							$( helpSection.seeking[ 3 ] ).html( '<em>ctrl</em> + <em><i class="material-icons">arrow_forward</i></em>Jump Forwards '
																+ vse.user.config.jumpForwardLength + 's' );

							// VSE Config
							$( helpSection.custom1[ 0 ] ).html( '<em>`</em> Open Video Streaming Enhanced Config' );
						} );
					} );
				}
			}
		} );
	};


	w.vse = vse;

})( window );

vse.init();