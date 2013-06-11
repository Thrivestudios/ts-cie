vex = (function() {
	var vex = {};

	function Vex(s) {
		var self = this;

		var width, height;

		var lastfm,
			queryArtistsArg = ['Porcupine Tree', 'The Mars Volta'],
			queryTagsArg = ['progressive', 'electronic', 'trip-hop'],
			queryArtists = [],
			queryTags = [],
			queryTagMap = {},
			// These containers are cleared each time new results are loaded from the server.
			resultArtists = [],
			resultArtistMap = {},
			resultTags = [],
			resultTagMap = {},
			// This map doesn't expire when new data is loaded from the server.
			persistentResultArtistMap = {},
			persistentResultTagMap = {},
			queryWires = [],
			resultWires = [],
			clusterWires = [];

		var snapRange = 12;
		var snapSpacing = 4;

		var selector = s;
		var validationTimeoutId;

		// Indicates whether new data was loaded since the last validation.
		var dataChanged;

		var maxResultArtists = 50,
			maxTagsPerQueryArtist = 5,
			maxTagsPerResultArtist = 5;

		// Markov graph clustering parameters.
		var mclPower = 2,
			mclInflation = 2;

		var HEADER_HEIGHT = 22;
		var QUERY_ARTISTS_MIN_WIDTH = 125;
		var QUERY_ARTISTS_MAX_WIDTH = 175;
		var QUERY_ARTISTS_COLLAPSED_WIDTH = 24;
		var QUERY_WIRES_MIN_WIDTH = 25;
		var QUERY_TAGS_MIN_WIDTH = 150;
		var QUERY_TAGS_MAX_WIDTH = 175;
		var RESULT_WIRES_MIN_WIDTH = 25;
		var RESULT_ARTISTS_MIN_WIDTH = 200;
		var RESULT_ARTISTS_MAX_WIDTH = 250;
		var CLUSTER_WIRES_MIN_WIDTH = 25;
		var RESULT_TAGS_MIN_WIDTH = 175;
		var RESULT_TAGS_MAX_WIDTH = 200;
		var RESULT_TAGS_COLLAPSED_WIDTH = 24;

		var showQueryArtists;
		var showQueryTags;
		var showResultTags;

		var queryArtistsWidth;
		var queryWiresWidth;
		var queryTagsWidth;
		var resultWiresWidth;
		var resultArtistsWidth;
		var clusterWiresWidth;
		var resultTagsWidth;

		var queryArtistsCollapsed = false;
		var resultTagsCollapsed = false;
		var columnsChanged = false;

		var sortColumn = 'resultTag';
		var sortChanged = false;

		// Layout coordinates.
		var queryArtistsRight,
			queryTagsLeft,
			queryTagsRight,
			resultArtistsLeft,
			resultArtistsRight,
			resultTagsLeft,
			queryArtistToQueryTagX,
			queryTagToResultArtistX,
			resultArtistToResultTagX;

		this.resize = function() {
			d3.select(selector + ' svg')
				.attr('width', width = $(selector).width())
				.attr('height', height = $(selector).height());
			this.invalidate();
		};

		this.invalidate = function() {
			if (validationTimeoutId == null) {
				validationTimeoutId = setTimeout(validate, 0);
			}
		}

		function init() {
			/**
			 * Javascript Last.FM API is copyright Felix Bruns.
			 * @see https://github.com/fxb/javascript-last.fm-api
			 */
			lastfm = new LastFM({
				apiKey: '8a57f9a75a3f925db5484d7d9fa013c2',
				apiSecret: '8d42845323e77bbfa61883746fa2aa6c'
			});

			loadArtistTopTags();
console.log(selector);
			var svg = d3.select(selector).append('svg')
				.attr('width', width = $(selector).width())
				.attr('height', height = $(selector).height());

			var d3queryArtistHeader = svg.append('g')
				.attr('class', 'header queryArtistHeader');

			d3queryArtistHeader.append('rect')
				.attr('class', 'bar');
			d3queryArtistHeader.append('text')
				.attr('class', 'label')
				.attr('dx', '0.85em')
				.attr('dy', '1.15em')
				.text('Search term seeds');
			d3queryArtistHeader.append('image')
				.attr('class', 'expandButton')
				.attr('xlink:href', 'bits/expand_right.png')
				.attr('width', 24)
				.attr('height', 24)
				.attr('display', 'none')
				.on('click', function() {
					d3.event.stopPropagation();
					queryArtistsCollapsed = false;
					columnsChanged = true;
					self.invalidate();
				});
			d3queryArtistHeader.append('image')
				.attr('class', 'collapseButton')
				.attr('xlink:href', 'bits/collapse_left.png')
				.attr('width', 24)
				.attr('height', 24)
				.attr('display', 'none')
				.on('click', function() {
					d3.event.stopPropagation();
					queryArtistsCollapsed = true;
					columnsChanged = true;
					self.invalidate();
				});

			var d3queryTagHeader = svg.append('g')
				.attr('class', 'header queryTagHeader');

			d3queryTagHeader.append('rect')
				.attr('class', 'bar');
			d3queryTagHeader.append('text')
				.attr('class', 'label')
				.attr('dx', '0.85em')
				.attr('dy', '1.15em')
				.text('Search terms');

			var d3resultArtistHeader = svg.append('g')
				.attr('class', 'header sortable resultArtistHeader');

			d3resultArtistHeader.append('rect')
				.attr('class', 'bar');
			d3resultArtistHeader.append('text')
				.attr('class', 'label')
				.attr('dx', '0.85em')
				.attr('dy', '1.15em')
				.text('Search results')
				.on('click', function() {
					d3.event.stopPropagation();
					sortColumn = 'resultArtist';
					sortChanged = true;
					self.invalidate();
				});
			d3resultArtistHeader.append('image')
				.attr('class', 'sortDescending')
				.attr('xlink:href', 'bits/sort_descending.png')
				.attr('x', d3resultArtistHeader.select('.label').node().getBBox().width + 10)
				.attr('width', 24)
				.attr('height', 24)
				.attr('display', 'none');

			var d3resultTagHeader = svg.append('g')
				.attr('class', 'header sortable resultTagHeader');

			d3resultTagHeader.append('rect')
				.attr('class', 'bar');
			d3resultTagHeader.append('text')
				.attr('class', 'label')
				.attr('dx', '0.85em')
				.attr('dy', '1.15em')
				.text('Result clusters')
				.on('click', function() {
					d3.event.stopPropagation();
					sortColumn = 'resultTag';
					sortChanged = true;
					self.invalidate();
				});
			d3resultTagHeader.append('image')
				.attr('class', 'sortDescending')
				.attr('xlink:href', 'bits/sort_descending.png')
				.attr('x', d3resultTagHeader.select('.label').node().getBBox().width + 10)
				.attr('width', 24)
				.attr('height', 24)
				.attr('display', 'none');
			d3resultTagHeader.append('image')
				.attr('class', 'expandButton')
				.attr('xlink:href', 'bits/expand_left.png')
				.attr('width', 24)
				.attr('height', 24)
				.attr('display', 'none')
				.on('click', function() {
					d3.event.stopPropagation();
					resultTagsCollapsed = false;
					columnsChanged = true;
					self.invalidate();
				});
			d3resultTagHeader.append('image')
				.attr('class', 'collapseButton')
				.attr('xlink:href', 'bits/collapse_right.png')
				.attr('width', 24)
				.attr('height', 24)
				.attr('display', 'none')
				.on('click', function() {
					d3.event.stopPropagation();
					resultTagsCollapsed = true;
					columnsChanged = true;
					self.invalidate();
				});

			d3.select('body').on('click', function() {
				d3.select(selector).selectAll('.queryWire.active')
					.transition()
						.duration(1000)
						.style('opacity', showQueryArtists && !queryArtistsCollapsed ? 0.6 : 0.01);
				d3.select(selector).selectAll('.resultWire.active')
					.transition()
						.duration(1000)
						.style('opacity', 0.6);
				d3.select(selector).selectAll('.clusterWire.active')
					.transition()
						.duration(1000)
						.style('opacity', showResultTags && !resultTagsCollapsed ? 0.6 : 0.01);
			});
		}

		function getLastfmDeferrable(lastfmFunction) {
			return function(queryObj, callback) {
				lastfmFunction(queryObj, {
					success: function(data) {
						callback(null, data);
					},
					error: function(code, message) {
						callback({code: code, message: message});
					}
				});
			}
		}

		function clusterSort(a,b) {
			// Positive clusters first.
			if (a.cluster == b.cluster) return b.score - a.score;
			if (a.cluster < 0) return b.cluster < 0 ? 0 : 1;
			if (b.cluster < 0) return -1;
			return a.cluster - b.cluster;
		}

		function loadArtistTopTags() {
			var artistQuery = queue();
			queryArtistsArg.forEach(function(d) {
				artistQuery.defer(getLastfmDeferrable(lastfm.artist.getTopTags), {artist: d});
			});
			artistQuery.awaitAll(function(error, results) {
				if (error) {
					console.error(error);
					return;
				}

				parseArtistTopTagResults(results);
				loadTagTopArtists();
			});

			queryArtistsArg = [];
		}

		function loadTagTopArtists() {
			dataChanged = true;
			resultArtists = [];
			resultArtistMap = {};
			resultWires = [];

			var tagQuery = queue();
			queryTags
				.filter(function(d) { return d.enabled; })
				.map(function(d) { return d.name; })
				.concat(queryTagsArg)
				.forEach(function(d) {
				tagQuery.defer(getLastfmDeferrable(lastfm.tag.getTopArtists), {tag: d});
			});
			tagQuery.awaitAll(function(error, results) {
				if (error) {
					console.error(error);
					return;
				}

				parseTagTopArtistResults(results);
				loadArtistClusterTags();
			});

			queryTagsArg = [];
		}

		function loadArtistClusterTags() {
			dataChanged = true;
			resultTags = [];
			resultTagMap = {};
			clusterWires = [];

			var artistQuery2 = queue();
			resultArtists.forEach(function(d) {
				artistQuery2.defer(getLastfmDeferrable(lastfm.artist.getTopTags), {artist: d.name});
			});
			artistQuery2.awaitAll(function(error, results) {
				if (error) {
					console.error(error);
					return;
				}

				parseArtistClusterTagResults(results);
				validate();
			});
		}

		function parseArtistTopTagResults(results) {
			results.forEach(function(result) {
				var artistName = result.toptags['@attr'].artist;
				var artist = {id: artistName.toLowerCase(), name: artistName};
				queryArtists.push(artist);

				result.toptags.tag.slice(0, maxTagsPerQueryArtist).forEach(function(tagData) {
					var tagId = tagData.name.toLowerCase();
					if (queryTagMap[tagId] == null) {
						queryTagMap[tagId] = tag = {id: tagId, name: tagData.name, enabled: true};
						queryTags.push(tag);
					}
					else {
						tag = queryTagMap[tagId];
					}

					queryWires.push({
						artist: artist,
						tag: tag,
						count: Number(tagData.count)
					});
				});
			});
		}

		function parseTagTopArtistResults(results) {
			// Artists are sorted and filtered after this so no point storing the map globally.
			var artistMap = {};
			results.forEach(function(result) {
				var tag, tagId = result.topartists['@attr'].tag.toLowerCase();
				if (queryTagMap[tagId] == null) {
					queryTagMap[tagId] = tag = {id: tagId, name: result.topartists['@attr'].tag, enabled: true};
					queryTags.push(tag);
				}
				else {
					tag = queryTagMap[tagId];
				}

				result.topartists.artist.forEach(function(artistData) {
					var artist, artistId = artistData.name.toLowerCase();
					if (persistentResultArtistMap[artistId] == null) {
						persistentResultArtistMap[artistId] = artist = {
							id: artistId,
							name: artistData.name,
							score: 0,
							cluster: -1,
							memberships: 0
						};
					}
					else {
						artist = persistentResultArtistMap[artistId];
					}

					if (artistMap[artistId] == null) {
						// Reset artist properties for this round since the object persisted from the last.
						artist.score = 50 - Number(artistData['@attr'].rank);
						artist.cluster = -1;
						artist.memberships = 0;

						artistMap[artistId] = resultArtists.length;
						resultArtists.push(artist);
					}
					else {
						artist.score += 50 - Number(artistData['@attr'].rank);
					}

					resultWires.push({
						tag: tag,
						artist: artist,
						score: 50 - Number(artistData['@attr'].rank)
					});
				});
			});

			// Filter the top artists. Remove wires for filtered artists.
			resultArtists.sort(function(a,b) { return b.score - a.score; });
			resultArtists = resultArtists.slice(0, maxResultArtists);
			var resultArtistIds = resultArtists.map(function(d) { return d.id; });
			resultWires = resultWires.filter(function(d) { return resultArtistIds.indexOf(d.artist.id) >= 0; });

			resultArtists.forEach(function(d) { resultArtistMap[d.id] = d; });
		}

		function parseArtistClusterTagResults(results) {
			var tag;
			var resultWireMap = {};
			results.forEach(function(result) {
				var artistId = result.toptags['@attr'].artist.toLowerCase();
				var artist = resultArtistMap[artistId];

				result.toptags.tag.slice(0, maxTagsPerResultArtist).forEach(function(tagData) {
					var tagId = tagData.name.toLowerCase();

					// Don't represent tags that were in the query.
					if (queryTagMap[tagId] != null) return;

					if (persistentResultTagMap[tagId] == null) {
						persistentResultTagMap[tagId] = tag = {
							id: tagId,
							name: tagData.name,
							artists: [],
							cluster: -1,
							score: 0
						};
					}
					else {
						tag = persistentResultTagMap[tagId];
					}

					if (resultTagMap[tagId] == null) {
						// Reset tag properties for this round since the object persisted from the last.
						tag.artists = [artist];
						tag.cluster = -1;
						tag.score = 0;

						resultTagMap[tagId] = tag;
						resultTags.push(tag);
					}
					else {
						tag.artists.push(artist);
					}

					artist.memberships++;

					clusterWires.push({
						artist: artist,
						tag: tag,
						count: Number(tagData.count)
					});
				});
			});

			// Don't care about tags that don't group artists. Remember to update the tag map and wires, too.
			resultTags = resultTags.filter(function(d) { return d.artists.length > 1; });
			resultTagMap = {};
			resultTags.forEach(function(d) {
				resultTagMap[d.id] = d;
				d.membershipSum = d3.sum(d.artists, function(d) { return d.memberships; });
			});
			clusterWires = clusterWires.filter(function(d) { return resultTagMap[d.tag.id] != null; });

			var remainingTags = resultTags.concat();
			var clusteredArtistIds = [];
			while (remainingTags.length > 0) {
				remainingTags.forEach(function(d) {
					d.newArtists = d.artists.filter(function(d) {
						return clusteredArtistIds.indexOf(d.id) < 0;
					});
					d.clusterScore = d.newArtists.length > 0
						? d.newArtists.length * d.newArtists.length / d.membershipSum
						: 0;
				});
				remainingTags.sort(function(a, b) { return a.clusterScore - b.clusterScore; });
				var bestTag = remainingTags.pop();
				bestTag.cluster = resultTags.length - remainingTags.length - 1;
				bestTag.artists.forEach(function(d) {
					if (d.cluster < 0) d.cluster = bestTag.cluster;
					if (clusteredArtistIds.indexOf(d.id) < 0) {
						clusteredArtistIds.push(d.id);
					}
				});
			}

			// If the tag doesn't cluster any new nodes then it's not helping narrow down the search.
			resultTags = resultTags.filter(function(d) { return d.newArtists.length > 0; });
			resultTagMap = {};
			resultTags.forEach(function(d) { resultTagMap[d.id] = d; });
			clusterWires = clusterWires.filter(function(d) { return resultTagMap[d.tag.id] != null; });

			// Assign scores to each cluster based on the scores of the artists they contain.
			resultTags.forEach(function(d, i) {
				d.score = d3.sum(d.artists.map(function(d) { return d.score; }));
			});

			// Sort clusters by score and reassign cluster numbers.
			var clusterMap = {};
			resultTags.sort(function(a, b) { return b.score - a.score; });
			resultTags.forEach(function(d, i) {
				clusterMap[d.cluster] = d.cluster = i;
			});
			resultArtists.forEach(function(d) { d.cluster = d.cluster < 0 ? -1 : clusterMap[d.cluster]; });
		}

		function validate() {
			if (validationTimeoutId) {
				clearTimeout(validationTimeoutId);
				validationTimeoutId = null;
			}

			validateSort();

			validateColumnPositions();
			validateHeaders();

			validateQueryArtists();
			validateQueryTags();
			validateResultArtists();
			validateResultTags();

			validateQueryWires();
			validateResultWires();
			validateClusterWires();

			dataChanged = false;
			columnsChanged = false;
			sortChanged = false;
		}

		function validateSort() {
			if (sortColumn == 'resultArtist') {
				// Sort artists by score.
				resultArtists.sort(function(a, b) { return b.score - a.score; });
			}
			else if (sortColumn == 'resultTag') {
				// Sort result artists by cluster membership.
				resultArtists.sort(clusterSort);
			}
		}

		function validateColumnPositions() {
			var numTextCols = 4;
			var numWireCols = 3;

			showQueryArtists = true;
			showQueryTags = true;
			showResultTags = true;

			queryArtistsWidth = QUERY_ARTISTS_MIN_WIDTH;
			queryWiresWidth = QUERY_WIRES_MIN_WIDTH;
			queryTagsWidth = QUERY_TAGS_MIN_WIDTH;
			resultWiresWidth = RESULT_WIRES_MIN_WIDTH;
			resultArtistsWidth = RESULT_ARTISTS_MIN_WIDTH;
			clusterWiresWidth = CLUSTER_WIRES_MIN_WIDTH;
			resultTagsWidth = RESULT_TAGS_MIN_WIDTH;

			var remaining = width
				- queryArtistsWidth - queryWiresWidth
				- queryTagsWidth - resultWiresWidth
				- resultArtistsWidth - clusterWiresWidth
				- resultTagsWidth;

			// Hide columns until we have enough room to fit everything.

			if (remaining < 0) {
				showQueryArtists = false;
				remaining += queryArtistsWidth + queryWiresWidth;
				queryArtistsWidth = 0;
				queryWiresWidth = 0;
				numTextCols--;
				numWireCols--;
			}

			if (remaining < 0) {
				showResultTags = false;
				remaining += clusterWiresWidth + resultTagsWidth;
				clusterWiresWidth = 0;
				resultTagsWidth = 0;
				numTextCols--;
				numWireCols--;
			}

			if (remaining < 0) {
				showQueryTags = false;
				remaining = queryTagsWidth + resultWiresWidth;
				queryTagsWidth = 0;
				resultWiresWidth = 0;
				numTextCols--;
				numWireCols--;

				resultArtistsWidth = remaining > RESULT_ARTISTS_MAX_WIDTH ? RESULT_ARTISTS_MAX_WIDTH : remaining;
			}
			else {
				// Divide up remaining width among remaining columns with the
				// text columns getting a bigger share until they reach max width.
				var textColRemaining = 0.7 * remaining;
				remaining -= textColRemaining;
				var textColEach = textColRemaining / numTextCols;

				if (showQueryArtists) {
					if (queryArtistsCollapsed) {
						remaining += queryArtistsWidth - QUERY_ARTISTS_COLLAPSED_WIDTH + queryWiresWidth + textColEach;
						queryArtistsWidth = QUERY_ARTISTS_COLLAPSED_WIDTH;
						queryWiresWidth = 0;
						numWireCols--;
					}
					else if (queryArtistsWidth + textColEach > QUERY_ARTISTS_MAX_WIDTH) {
						// Put the leftover back in the remaining.
						remaining += textColEach - QUERY_ARTISTS_MAX_WIDTH + queryArtistsWidth;
						queryArtistsWidth = QUERY_ARTISTS_MAX_WIDTH;
					}
					else {
						queryArtistsWidth += textColEach;	
					}
				}

				if (showQueryTags) {
					if (queryTagsWidth + textColEach > QUERY_TAGS_MAX_WIDTH) {
						// Put the leftover back in the remaining.
						remaining += textColEach - QUERY_TAGS_MAX_WIDTH + queryTagsWidth;
						queryTagsWidth = QUERY_TAGS_MAX_WIDTH;
					}
					else {
						queryTagsWidth += textColEach;	
					}
				}

				if (resultArtistsWidth + textColEach > RESULT_ARTISTS_MAX_WIDTH) {
					// Put the leftover back in the remaining.
					remaining += textColEach - RESULT_ARTISTS_MAX_WIDTH + resultArtistsWidth;
					resultArtistsWidth = RESULT_ARTISTS_MAX_WIDTH;
				}
				else {
					resultArtistsWidth += textColEach;	
				}

				if (showResultTags) {
					if (resultTagsCollapsed) {
						remaining += resultTagsWidth - RESULT_TAGS_COLLAPSED_WIDTH + clusterWiresWidth + textColEach;
						resultTagsWidth = RESULT_TAGS_COLLAPSED_WIDTH;
						clusterWiresWidth = 0;
						numWireCols--;
					}
					else if (resultTagsWidth + textColEach > RESULT_TAGS_MAX_WIDTH) {
						// Put the leftover back in the remaining.
						remaining += textColEach - RESULT_TAGS_MAX_WIDTH + resultTagsWidth;
						resultTagsWidth = RESULT_TAGS_MAX_WIDTH;
					}
					else {
						resultTagsWidth += textColEach;	
					}
				}

				var wireColEach = remaining / numWireCols;

				if (showQueryArtists && !queryArtistsCollapsed) {
					queryWiresWidth += wireColEach;
				}
				resultWiresWidth += wireColEach;
				if (showResultTags && !resultTagsCollapsed) {
					clusterWiresWidth += wireColEach;
				}
			}

			queryArtistsRight = queryArtistsWidth;
			queryTagsLeft = queryArtistsRight + queryWiresWidth;
			queryTagsRight = queryTagsLeft + queryTagsWidth;
			resultArtistsLeft = queryTagsRight + resultWiresWidth;
			resultArtistsRight = resultArtistsLeft + resultArtistsWidth;
			resultTagsLeft = resultArtistsRight + clusterWiresWidth;

			queryArtistToQueryTagX = queryArtistsRight + queryWiresWidth/2;
			queryTagToResultArtistX = queryTagsRight + resultWiresWidth/2;
			resultArtistToResultTagX = resultArtistsRight + clusterWiresWidth/2;
		}

		function validateHeaders() {
			var svg = d3.select(selector + ' svg');

			var selection;

			selection = svg.select('.queryArtistHeader');
			if (columnsChanged) {
				selection = selection.transition()
					.duration(300);
			}
			selection
				.attr('transform', 'translate(' + [0, 0] + ')');

			selection = svg.select('.queryArtistHeader .bar');
			if (columnsChanged) {
				selection = selection.transition()
					.duration(300);
			}
			selection
				.attr('width', showQueryArtists ? queryArtistsWidth + queryWiresWidth - 2 : 0)
				.attr('height', HEADER_HEIGHT);

			svg.select('.queryArtistHeader .label')
				.transition()
					.duration(300)
					.style('opacity', queryArtistsCollapsed ? 0.01 : 1);

			selection = svg.select('.queryArtistHeader .expandButton')
				.attr('display', showQueryArtists && queryArtistsCollapsed ? 'inline' : 'none');
			if (columnsChanged) {
				selection = selection.transition()
					.duration(300);
			}
			selection
				.attr('x', queryArtistsWidth + queryWiresWidth - 24 - 2);

			selection = svg.select('.queryArtistHeader .collapseButton')
				.attr('display', !showQueryArtists || queryArtistsCollapsed ? 'none' : 'inline');
			if (columnsChanged) {
				selection = selection.transition()
					.duration(300);
			}
			selection
				.attr('x', queryArtistsWidth + queryWiresWidth - 24 - 2);

			selection = svg.select('.queryTagHeader');
			if (columnsChanged) {
				selection = selection.transition()
					.duration(300);
			}
			selection
				.attr('transform', 'translate(' + [queryTagsLeft, 0] + ')');

			selection = svg.select('.queryTagHeader .bar');
			if (columnsChanged) {
				selection = selection.transition()
					.duration(300);
			}
			selection
				.attr('width', queryTagsWidth + resultWiresWidth - 2)
				.attr('height', HEADER_HEIGHT);

			selection = svg.select('.resultArtistHeader');
			if (columnsChanged) {
				selection = selection.transition()
					.duration(300);
			}
			selection
				.attr('transform', 'translate(' + [resultArtistsLeft, 0] + ')');

			svg.select('.resultArtistHeader .sortDescending')
				.attr('display', sortColumn == 'resultArtist' ? 'inline' : 'none');

			selection = svg.select('.resultArtistHeader .bar');
			if (columnsChanged) {
				selection = selection.transition()
					.duration(300);
			}
			selection
				.attr('width', resultArtistsWidth + clusterWiresWidth - 2)
				.attr('height', HEADER_HEIGHT);

			selection = svg.select('.resultTagHeader');
			if (columnsChanged) {
				selection = selection.transition()
					.duration(300);
			}
			selection
				.attr('transform', 'translate(' + [resultTagsLeft, 0] + ')');

			svg.select('.resultTagHeader .sortDescending')
				.attr('display', sortColumn == 'resultTag' ? 'inline' : 'none');

			selection = svg.select('.resultTagHeader .bar');
			if (columnsChanged) {
				selection = selection.transition()
					.duration(300);
			}
			selection
				.attr('width', showResultTags ? resultTagsWidth : 0)
				.attr('height', HEADER_HEIGHT);

			svg.select('.resultTagHeader .label')
				.transition()
					.duration(300)
					.style('opacity', resultTagsCollapsed ? 0.01 : 1);

			selection = svg.select('.resultTagHeader .expandButton')
				.attr('display', showResultTags && resultTagsCollapsed ? 'inline' : 'none');
			if (columnsChanged) {
				selection = selection.transition()
					.duration(300);
			}
			selection
				.attr('x', resultTagsWidth - 24 - 2);

			selection = svg.select('.resultTagHeader .collapseButton')
				.attr('display', !showResultTags || resultTagsCollapsed ? 'none' : 'inline');
			if (columnsChanged) {
				selection = selection.transition()
					.duration(300);
			}
			selection
				.attr('x', resultTagsWidth - 24 - 2);
		}

		function validateQueryArtists() {
			var svg = d3.select(selector + ' svg');

			var selection = svg.selectAll('.queryArtist.active')
					.data(queryArtists, function(d) { return d.id; });

			var s = selection;
			if (dataChanged) {
				s = s.transition()
					.delay(500)
					.duration(500);
			}
			else if (columnsChanged) {
				s = s.transition()
					.duration(300);
			}
			s
				.style('opacity', showQueryArtists && !queryArtistsCollapsed ? 1 : 0.01)
				.attr('transform', function(d, i) {
					d.px = d.x;
					d.py = d.y;
					d.x = queryArtistsRight - d.bbox.width - 5;
					d.y = HEADER_HEIGHT + 150 + 40 * i;
					return 'translate(' + [d.x, d.y] + ')';
				});

			var enter = selection 
				.enter().append('g')
					.attr('class', 'queryArtist active')
					.on('click', function(artist) {
						d3.event.stopPropagation();
						d3.select(selector).selectAll('.queryWire.active')
							.transition()
								.duration(500)
								.style('opacity', function(d) {
									return showQueryArtists && !queryArtistsCollapsed
										&& d.artist.id == artist.id ? 0.6 : 0.01;
								});

						var relatedQueryTagIds = queryWires
							.filter(function(d) { return d.artist.id == artist.id; })
							.map(function(d) { return d.tag.id; });
						d3.select(selector).selectAll('.resultWire.active')
							.transition()
								.duration(500)
								.style('opacity', function(d) { return relatedQueryTagIds.indexOf(d.tag.id) >= 0 ? 0.6 : 0.01; });

						var relatedResultArtistIds = resultWires
							.filter(function(d) { return relatedQueryTagIds.indexOf(d.tag.id) >= 0; })
							.map(function(d) { return d.artist.id; });
						d3.select(selector).selectAll('.clusterWire.active')
							.transition()
								.duration(500)
								.style('opacity', function(d) {
									return showResultTags && !resultTagsCollapsed
										&& relatedResultArtistIds.indexOf(d.artist.id) >= 0 ? 0.6 : 0.01;
								});
					});

			enter.append('text')
				.attr('class', 'label')
				.attr('dy', '0.35em')
				.text(function(d) { return d.name; })
				.each(function(d) { d.bbox = this.getBBox(); });

			enter
					.attr('transform', function(d, i) {
						d.px = d.x;
						d.py = d.y;
						d.x = queryArtistsRight - d.bbox.width - 5;
						d.y = HEADER_HEIGHT + 150 + 40 * i;
						return 'translate(' + [d.x, d.y] + ')';
					});
		}

		function validateQueryTags() {
			var svg = d3.select(selector + ' svg');

			var drag = d3.behavior.drag()
				.on('drag', function(d, i) {
		            d.y += d3.event.dy;
		            if (d.y < HEADER_HEIGHT + 14) d.y = HEADER_HEIGHT + 14;
		            if (d.y + 14 > height) d.y = height - 14;

		            d3.select(this).attr("transform", function(d, i) {
		                return "translate(" + [d.x, d.y] + ")";
		            });
	            	// FIXME: Only redraw wires that are connected to this query tag.
					d3.select(selector).selectAll('.queryWire.active path')
						.attr('d', queryWirePath);
					d3.select(selector).selectAll('.resultWire.active path')
						.attr('d', resultWirePath);
				});

			var selection = svg.selectAll('.queryTag')
					.data(queryTags, function(d) { return d.id; });

			var s = selection;
			if (dataChanged) {
				s = s.transition()
					.delay(500)
					.duration(500);
			}
			else if (columnsChanged) {
				s = s.transition()
					.duration(300);
			}
			s
				.style('opacity', 1)
				.attr('transform', function(d, i) {
					d.px = d.x;
					d.py = d.y;
					d.x = queryTagsRight - d.bbox.width - 5;
					if (isNaN(d.y)) d.y = HEADER_HEIGHT + 150 + 40 * i;
					return 'translate(' + [d.x, d.y] + ')';
				});

			var enter = selection
				.enter().append('g')
					.attr('class', 'queryTag active')
					.on('click', function(tag) {
						d3.event.stopPropagation();
						d3.select(selector).selectAll('.queryWire.active')
							.transition()
								.duration(500)
								.style('opacity', function(d) {
									return showQueryArtists && !queryArtistsCollapsed
										&& d.tag.id == tag.id ? 0.6 : 0.01; });

						d3.select(selector).selectAll('.resultWire.active')
							.transition()
								.duration(500)
								.style('opacity', function(d) { return d.tag.id == tag.id ? 0.6 : 0.01; });

						var relatedResultArtistIds = resultWires
							.filter(function(d) { return d.tag.id == tag.id; })
							.map(function(d) { return d.artist.id; });
						d3.select(selector).selectAll('.clusterWire.active')
							.transition()
								.duration(500)
								.style('opacity', function(d) {
									return showResultTags && !resultTagsCollapsed
										&& relatedResultArtistIds.indexOf(d.artist.id) >= 0 ? 0.6 : 0.01;
								});
					})
					.call(drag);

			enter.append('text')
				.attr('class', 'label')
				.attr('dy', '0.35em')
				.text(function(d) { return d.name; })
				.each(function(d) { d.bbox = this.getBBox(); });

			// FIXME: Replace with an image-based checkbox that doesn't look fugly.
			enter.append('text')
				.attr('class', 'checkbox')
				.attr('x', function(d) { return d.bbox.width + 5; })
				.attr('dy', '0.35em')
				.text(function(d) { return d.enabled ? "\u2611" : "\u2610"; })
				.each(function(d) {
					var bbox = this.getBBox();
					d.bbox = {
						x: d.bbox.x,
						y: d.bbox.y,
						width: d.bbox.width + 5 + bbox.width,
						height: Math.max(d.bbox.height, bbox.height)
					};
				})
				.on('click', function(d) {
					d3.event.stopPropagation();
					d.enabled = !d.enabled;

					loadTagTopArtists();
				});

			// Refresh enabled/disabled state.
			selection
				.classed('disabled', function(d) { return !d.enabled; })

			// Refresh checkbox values.
			d3.select(selector).selectAll('.queryTag.active .checkbox')
				.text(function(d) { return d.enabled ? "\u2611" : "\u2610"; });

			enter
				.attr('transform', function(d, i) {
					d.px = d.x;
					d.py = d.y;
					d.x = queryTagsRight - d.bbox.width - 5;
					d.y = HEADER_HEIGHT + 150 + 40 * i;
					return 'translate(' + [d.x, d.y] + ')';
				});
		}

		function validateResultArtists() {
			var svg = d3.select(selector + ' svg');
			
			var selection = svg.selectAll('.resultArtist')
					.data(resultArtists, function(d) { return d.id; });

			selection
				.exit()
					.classed('active', false)
					.transition()
						.duration(500)
						.style('opacity', 0.01)
						.remove();

			var s = selection;
			if (dataChanged) {
				s = s.transition()
					.delay(500)
					.duration(500);
			}
			else if (columnsChanged) {
				s = s.transition()
					.duration(300);
			}
			else if (sortChanged) {
				s = s.transition()
					.duration(500);
			}
			s
				.style('opacity', 1)
				.attr('transform', function(d, i) {
					d.px = d.x;
					d.py = d.y;
					d.x = resultArtistsLeft + 5;
					d.y = HEADER_HEIGHT + 10 + 16 * i;
					return 'translate(' + [d.x, d.y] + ')';
				});

			var enter = selection
				.enter().append('g')
					.attr('class', 'resultArtist active')
					.attr('transform', function(d, i) {
						d.px = d.x;
						d.py = d.y;
						d.x = resultArtistsLeft + 5;
						d.y = HEADER_HEIGHT + 10 + 16 * i;
						return 'translate(' + [d.x, d.y] + ')';
					})
					.on('click', function(artist) {
						d3.event.stopPropagation();
						d3.select(selector).selectAll('.clusterWire.active')
							.transition()
								.duration(500)
								.style('opacity', function(d) {
									return showResultTags && !resultTagsCollapsed
										&& d.artist.id == artist.id ? 0.6 : 0.01;
								});

						d3.select(selector).selectAll('.resultWire.active')
							.transition()
								.duration(500)
								.style('opacity', function(d) { return d.artist.id == artist.id ? 0.6 : 0.01; });

						var relatedQueryTagIds = resultWires
							.filter(function(d) { return d.artist.id == artist.id; })
							.map(function(d) { return d.tag.id; });
						d3.select(selector).selectAll('.queryWire.active')
							.transition()
								.duration(500)
								.style('opacity', function(d) {
									return showQueryArtists && !queryArtistsCollapsed
										&& relatedQueryTagIds.indexOf(d.tag.id) >= 0 ? 0.6 : 0.01;
								});
					});

			enter.append('text')
				.attr('class', 'label')
				.attr('dy', '0.35em');
			d3.select(selector).selectAll('.resultArtist.active .label')
				.text(function(d) { return d.name + ' (' + d.score + ')'; })
				.each(function(d) { d.bbox = this.getBBox(); });

			enter
				.style('opacity', 0.01)
				.transition()
					.delay(1000)
					.duration(500)
					.style('opacity', 1);
		}

		function validateResultTags() {
			var svg = d3.select(selector + ' svg');
			
			var resultTagY = getResultTagY(resultTags);
			var drag = d3.behavior.drag()
				.on('dragstart', function(d, i) {
					d.my = d.y;
				})
				.on('drag', function(d, i) {
		            d.my += d3.event.dy;
		            if (d.my < HEADER_HEIGHT + 2) d.my = HEADER_HEIGHT + 2;
		            if (d.my + resultTagHeight(d) > height - 2) d.my = height - 2 - resultTagHeight(d);

		            // Snapping.
		            var snapped = false;
		            d.y = d.my;
		            svg.selectAll('.resultTag.active')
		            	.each(function(d2, i) {
		            		if (snapped || d2 == d) return;
		            		if (Math.abs(d.y - (d2.y + resultTagHeight(d2) + snapSpacing)) < snapRange) {
		            			d.y = d2.y + resultTagHeight(d2) + snapSpacing;
		            			snapped = true;
		            		}
		            		else if (Math.abs((d.y + resultTagHeight(d) + snapSpacing) - d2.y) < snapRange) {
		            			d.y = d2.y - resultTagHeight(d) - snapSpacing;
		            			snapped = true;
		            		}
		            	});

		            d3.select(this).attr("transform", function(d, i) {
		                return "translate(" + [d.x, d.y] + ")";
		            });
	            	// FIXME: Only redraw wires that are connected to this result tag.
					d3.select(selector).selectAll('.clusterWire.active path')
						.attr('d', clusterWirePath);
				});

			var selection = svg.selectAll('.resultTag')
					.data(resultTags, function(d) { return d.id; });

			selection
				.exit()
					.classed('active', false)
					.transition()
						.duration(500)
						.style('opacity', 0.01)
						.remove();

			var s = selection;
			if (dataChanged) {
				s = s.transition()
					.delay(500)
					.duration(500);
			}
			else if (columnsChanged) {
				s = s.transition()
					.duration(300);
			}
			else if (sortChanged) {
				s = s.transition()
					.duration(500);
			}
			s
				.style('opacity', showResultTags && !resultTagsCollapsed ? 1 : 0.01)
				.attr('transform', function(d, i) {
					d.px = d.x;
					d.x = resultTagsLeft + 5;
					if (dataChanged || (sortChanged && sortColumn == 'resultTag') || isNaN(d.y)) {
						d.py = d.y;
						d.y = HEADER_HEIGHT + resultTagY(d, i);
					}
					return 'translate(' + [d.x, d.y] + ')';
				});

			selection.select('.bar')
				.transition()
					.delay(500)
					.duration(500)
					.attr('height', resultTagHeight);

			var enter = selection
				.enter().append('g')
					.attr('class', 'resultTag active')
					.attr('transform', function(d, i) {
						d.x = resultTagsLeft + 5;
						if (dataChanged || isNaN(d.y)) {
							d.py = d.y;
							d.y = HEADER_HEIGHT + resultTagY(d, i);
						}
						return 'translate(' + [d.x, d.y] + ')';
					})
					.on('click', function(tag) {
						d3.event.stopPropagation();
						d3.select(selector).selectAll('.clusterWire.active')
							.transition()
								.duration(500)
								.style('opacity', function(d) {
									return showResultTags && !resultTagsCollapsed
										&& d.tag.id == tag.id ? 0.6 : 0.01;
								});

						var relatedResultArtistIds = clusterWires
							.filter(function(d) { return d.tag.id == tag.id; })
							.map(function(d) { return d.artist.id; });
						d3.select(selector).selectAll('.resultWire.active')
							.transition()
								.duration(500)
								.style('opacity', function(d) { return relatedResultArtistIds.indexOf(d.artist.id) >= 0 ? 0.6 : 0.01; });

						var relatedQueryTagIds = resultWires
							.filter(function(d) { return relatedResultArtistIds.indexOf(d.artist.id) >= 0; })
							.map(function(d) { return d.tag.id; });
						d3.select(selector).selectAll('.queryWire.active')
							.transition()
								.duration(500)
								.style('opacity', function(d) {
									return showQueryArtists && !queryArtistsCollapsed
										&& relatedQueryTagIds.indexOf(d.tag.id) >= 0 ? 0.6 : 0.01;
								});
					})
					.call(drag);

			enter.append('rect')
				.attr('class', 'bar')
				.attr('width', 8)
				.attr('height', resultTagHeight);

			enter.append('text')
				.attr('class', 'label')
				.attr('dx', '1.1em')
				.attr('dy', '1.35em');
			d3.select(selector).selectAll('.resultTag .label')
				.text(function(d) { return d.name + ' (' + d.score + ')'; })
				.each(function(d) { d.bbox = this.getBBox(); });

			enter
				.style('opacity', 0.01)
				.transition()
					.delay(500)
					.duration(500)
					.style('opacity', 1);
		}

		function validateQueryWires() {
			var svg = d3.select(selector + ' svg');
			
			var selection = svg.selectAll('.queryWire')
					.data(queryWires, function(d) { return d.artist.id + '--' + d.tag.id; });

			selection	
				.exit()
					.classed('active', false)
					.transition()
						.duration(500)
						.style('opacity', 0.01)
						.remove();

			var enter = selection 
				.enter().append('g')
					.attr('class', 'queryWire active')
					.style('opacity', 0.01);

			var wireCountMax = d3.max(queryWires.map(function(d) { return d.count; }));
			enter.append('path')
				.style('stroke-width', function(d) {
					return 2 + 8 * d.count / wireCountMax;
				})
				.attr('d', function(d) {
					// Start at the previous position if available and transition to new (current position).
					return 'M ' + queryArtistsRight + ' ' + (isNaN(d.artist.py) ? d.artist.y : d.artist.py)
						+ ' C ' + queryArtistToQueryTagX + ' ' + (isNaN(d.artist.py) ? d.artist.y : d.artist.py)
						+ ' ' + queryArtistToQueryTagX + ' ' + (isNaN(d.tag.py) ? d.tag.y : d.tag.py)
						+ ' ' + queryTagsLeft + ' ' + (isNaN(d.tag.py) ? d.tag.y : d.tag.py);
				});

			var s;
			s = selection;
			if (dataChanged) {
				s = s.transition()
					.delay(500)
					.duration(500);
			}
			else if (columnsChanged) {
				s = s.transition()
					.duration(300);
			}
			s
				.style('opacity', showQueryArtists && !queryArtistsCollapsed ? 0.6 : 0.01);

			s = selection.select('path');
			if (dataChanged) {
				s = s.transition()
					.delay(500)
					.duration(500);
			}
			else if (columnsChanged) {
				s = s.transition()
					.duration(300);
			}
			s
				.attr('d', queryWirePath);
		}

		function validateResultWires() {
			var svg = d3.select(selector + ' svg');
			var selection = svg.selectAll('.resultWire')
					.data(resultWires, function(d) { return d.tag.id + '--' + d.artist.id; });

			selection
				.exit()
					.classed('active', false)
					.transition()
						.duration(500)
						.style('opacity', 0.01)
						.remove();


			var enter = selection
				.enter().append('g')
					.attr('class', 'resultWire active')
					.style('opacity', 0.01);

			var wireScoreMax = d3.max(resultWires.map(function(d) { return d.score; }));
			enter.append('path')
				.style('stroke-width', function(d) {
					return 2 + 8 * d.score / wireScoreMax;
				})
				.attr('d', function(d) {
					// Start at the previous position if available and transition to new (current position).
					return 'M ' + queryTagsRight + ' ' + (isNaN(d.tag.py) ? d.tag.y : d.tag.py)
						+ ' C ' + queryTagToResultArtistX + ' ' + (isNaN(d.tag.py) ? d.tag.y : d.tag.py)
						+ ' ' + queryTagToResultArtistX + ' ' + (isNaN(d.artist.py) ? d.artist.y : d.artist.py)
						+ ' ' + resultArtistsLeft + ' ' + (isNaN(d.artist.py) ? d.artist.y : d.artist.py);
				});

			var s;
			s = selection;
			if (dataChanged) {
				s = s.transition()
					.delay(500)
					.duration(500);
			}
			else if (columnsChanged) {
				s = s.transition()
					.duration(300);
			}
			s
				.style('opacity', function(d) { return showQueryTags && d.tag.enabled ? 0.6 : 0.01; });

			s = selection.select('path');
			if (dataChanged) {
				s = s.transition()
					.delay(500)
					.duration(500);
			}
			else if (columnsChanged) {
				s = s.transition()
					.duration(300);
			}
			else if (sortChanged) {
				s = s.transition()
					.duration(500);
			}
			s
				.attr('d', resultWirePath);
		}

		function validateClusterWires() {
			var svg = d3.select(selector + ' svg');
			var selection = svg.selectAll('.clusterWire')
					.data(clusterWires, function(d) { return d.artist.id + '--' + d.tag.id; })

			selection
				.exit()
					.classed('active', false)
					.transition()
						.duration(500)
						.style('opacity', 0.01)
						.remove();

			var enter = selection
				.enter().append('g')
					.attr('class', 'clusterWire active')
					.style('opacity', 0.01);

			var wireCountMax = d3.max(clusterWires.map(function(d) { return d.count; }));
			enter.append('path')
				.style('stroke-width', function(d) {
					return 2 + 8 * d.count / wireCountMax;
				})
				.attr('d', function(d) {
					// Start at the previous position if available and transition to new (current position).
					return 'M ' + resultArtistsRight + ' ' + (isNaN(d.artist.py) ? d.artist.y : d.artist.py)
						+ ' C ' + resultArtistToResultTagX + ' ' + (isNaN(d.artist.py) ? d.artist.y : d.artist.py)
						+ ' ' + resultArtistToResultTagX + ' ' + ((isNaN(d.tag.py) ? d.tag.y : d.tag.py) + 13)
						+ ' ' + resultTagsLeft + ' ' + ((isNaN(d.tag.py) ? d.tag.y : d.tag.py) + 13);
				});

			var s;
			s = selection;
			if (dataChanged) {
				s = s.transition()
					.delay(500)
					.duration(500);
			}
			else if (columnsChanged) {
				s = s.transition()
					.duration(300);
			}
			s
				.style('opacity', showResultTags && !resultTagsCollapsed ? 0.6 : 0.01);

			s = selection.select('path');
			if (dataChanged) {
					s = s.transition()
						.delay(500)
						.duration(500);
			}
			else if (columnsChanged) {
				s = s.transition()
					.duration(300);
			}
			else if (sortChanged) {
				s = s.transition()
					.duration(500);
			}
			s
				.attr('d', clusterWirePath);
		}

		function queryWirePath(d, i) {
			return 'M ' + queryArtistsRight + ' ' + d.artist.y
				+ ' C ' + queryArtistToQueryTagX + ' ' + d.artist.y
				+ ' ' + queryArtistToQueryTagX + ' ' + d.tag.y
				+ ' ' + queryTagsLeft + ' ' + d.tag.y;
		}

		function resultWirePath(d, i) {
			return 'M ' + queryTagsRight + ' ' + d.tag.y
				+ ' C ' + queryTagToResultArtistX + ' ' + d.tag.y
				+ ' ' + queryTagToResultArtistX + ' ' + d.artist.y
				+ ' ' + resultArtistsLeft + ' ' + d.artist.y;
		}

		function clusterWirePath(d, i) {
			return 'M ' + resultArtistsRight + ' ' + d.artist.y
				+ ' C ' + resultArtistToResultTagX + ' ' + d.artist.y
				+ ' ' + resultArtistToResultTagX + ' ' + (d.tag.y + 13)
				+ ' ' + resultTagsLeft + ' ' + (d.tag.y + 13);
		}

		function getResultTagY(resultTags) {
			var positions = [], y = 2;
			resultTags.forEach(function(d, i) {
				positions[i] = y;
				y += resultTagHeight(d, i) + snapSpacing;
			});
			var f = function(d, i, a) {
				return positions[i];
			};
			return f;
		}

		function resultTagHeight(d, i) {
			return 22 + d.artists.length * 3;
		}

		init();
	}

	vex.init = function(selector) {
		return new Vex(selector);
	}

	return vex;
})();
