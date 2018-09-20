import $ from '$';

import {saveAs} from 'filesaver.js';
import HAWCModal from 'utils/HAWCModal';

import {
    NULL_CASE,
} from './shared';

import Library from "./Library";
import EvidenceProfileStream from "./EvidenceProfileStream";
import EvidenceProfileTable from "./EvidenceProfileTable";

import {renderEvidenceProfileStreamsFormset} from "./components/EvidenceProfileStreams";
import {renderCrossStreamInferencesFormset} from "./components/CrossStreamInferences";

// This class is intended to hold an Evidence Profile object -- essentially all of the data needed to generate an Evidence Profile report,
// or a form for creating and managing an Evidence Profile
class EvidenceProfile {
    constructor(configuration) {
        // This constructor is empty, all work happens through static methods
        // The object represented by this class is intended to be a singleton -- i.e. there will only be one in use on a page at any time
    }

    static configure(configuration, object) {
        // Set the default set of D3 image settings for this table
        this.defaultSettings = {
            "plot_settings": {
                "plot_width": 400,
                "minimum_row_height": 12,
                "padding": {
                    "top": 25,
                    "right": 25,
                    "bottom": 40,
                    "left": 20
                },
                "title": "Title",
                "axis_label": "Axis label",
                "logscale": false,
                "show_xticks": true,
                "show_yticks": true,
                "domain": "200",
                "filter_logic": "and",
                "font_style": "Arial",
                "merge_descriptions": true,
                "merge_aggressive": true,
                "text_background": true,
                "text_background_color": "#eeeeee",
                "as_barchart": true,
                "merge_until": 7
            },
            "legend": {
                "show": true,
                "left": 230,
                "top": 27,
                "columns": 1,
                "style": {
                    "border_color": "#666666",
                    "border_width": "2px"
                },
                "fields": [
                    {
                        "line_style": "---",
                        "symbol_style": "square | red",
                        "rect_style": "---",
                        "label": "Significant"
                    },
                    {
                        "keyField": "barChartBar",
                        "label": "percent control mean",
                        "rect_style": "base",
                        "line_style": "---",
                        "symbol_style" :"---"
                    },
                    {
                        "keyField": "barChartError",
                        "label": "percent control low",
                        "line_style": "base",
                        "symbol_style": "---",
                        "rect_style": "---"
                    }
                ]
            },
            "dataline_settings": [
                {
                    "low_field_name": "percent control low",
                    "high_field_name": "percent control high",
                    "header_name": "percent control low",
                    "marker_style": "base"
                }
            ],
            "datapoint_settings": [
                {
                    "field_name": "incidence",
                    "header_name": "incidence",
                    "marker_style": "circle | black",
                    "dpe": "endpoint_complete",
                    "conditional_formatting": []
                },
                {
                    "field_name": "response",
                    "header_name": "response",
                    "marker_style": "base",
                    "dpe": "---",
                    "conditional_formatting": []
                },
                {
                    "field_name": "---",
                    "header_name": "---",
                    "marker_style": "base",
                    "dpe": "---",
                    "conditional_formatting": []
                }
            ],
            "description_settings": [
                {
                    "field_name": "study name",
                    "header_name": "Study",
                    "header_style": "header",
                    "text_style": "base",
                    "dpe": "study",
                    "field_index": "study name",
                    "max_width": 100
                },
                {
                    "field_name": "animal description (with N)",
                    "header_name": "Study Design (n per group)",
                    "header_style": "header",
                    "text_style": "base",
                    "dpe": "animal_group",
                    "field_index": "animal description (with N)",
                    "max_width": 200
                },
                {
                    "field_name": "system",
                    "header_name": "System",
                    "header_style": "header middle alignment",
                    "text_style": "base middle",
                    "dpe": "endpoint_complete",
                    "field_index": "system",
                    "max_width": 100
                },
                {
                    "field_name": "route",
                    "header_name": "Route",
                    "header_style": "header middle alignment",
                    "text_style": "base",
                    "dpe": "animal_group",
                    "field_index": "route",
                    "max_width": 75
                },
                {
                    "field_name": "treatment period",
                    "header_name": "Treatment Period",
                    "header_style": "header",
                    "text_style": "base",
                    "dpe": "animal_group",
                    "field_index": "treatment period",
                    "max_width": 75
                },
                {
                    "field_name": "endpoint name",
                    "header_name": "Endpoint",
                    "header_style": "header",
                    "text_style": "base",
                    "dpe": "endpoint_complete",
                    "field_index": "endpoint name",
                    "max_width": 100
                },
                {
                    "field_name": "tags",
                    "header_name": "Overall Study Confidence (per Endpoint)",
                    "header_style": "header",
                    "text_style": "base",
                    "dpe": "study",
                    "field_index": "tags",
                    "max_width": 150
                },
                {
                    "field_name": "response units",
                    "header_name": "Units",
                    "header_style": "header",
                    "text_style": "base middle",
                    "dpe": "endpoint_complete",
                    "field_index": "response units",
                    "max_width": 25
                },
                {
                    "field_name": "dose",
                    "header_name": "Dose (ppm)",
                    "header_style": "header",
                    "text_style": "base",
                    "dpe": "endpoint_complete",
                    "field_index": "dose",
                    "max_width": 50
                }
            ],
            "barchart": {
                "dpe": "endpoint_complete",
                "field_name": "percent control mean",
                "error_low_field_name": "percent control low",
                "error_high_field_name": "percent control high",
                "header_name": "percent control mean",
                "error_header_name": "percent control low",
                "bar_style": "base",
                "error_marker_style": "base",
                "conditional_formatting": [
                    {
                        "discrete_styles": [
                            {
                                "key": "Urinary",
                                "style": "base"
                            },
                            {
                                "key": "Digestive system",
                                "style": "base"
                            },
                            {
                                "key": "Female reproductive system",
                                "style": "base"
                            },
                            {
                                "key": "Respiratory",
                                "style": "base"
                            },
                            {
                                "key": "female reproductive system",
                                "style": "base"
                            },
                            {
                                "key": "respiratory",
                                "style": "base"
                            },
                            {
                                "key": "digestive system",
                                "style": "base"
                            },
                            {
                                "key": "",
                                "style": "red"
                            },
                            {
                                "key": "Musculoskeletal",
                                "style": "base"
                            }
                        ],
                        "field_name": "system",
                        "condition_type": "discrete-style",
                        "min_size": 50,
                        "max_size": 150,
                        "min_color": "#eee13d",
                        "max_color": "#2320d9"
                    },
                    {
                        "discrete_styles": [
                            {
                                "key": false,
                                "style": "---"
                            },
                            {
                                "key": true,
                                "style": "red"
                            }
                        ],
                        "field_name": "pairwise significant",
                        "condition_type": "discrete-style",
                        "min_size": 50,
                        "max_size": 150,
                        "min_color": "#eee13d",
                        "max_color": "#2320d9"
                    }
                ]
                ,"error_show_tails": true
            },
            "spacers": [
                {
                    "index": -1,
                    "show_line": true,
                    "line_style": "reference line",
                    "extra_space": false
                }
            ],
            "sorts": [
                {
                    "field_name": "system",
                    "ascending": true
                },
                {
                    "field_name": "study name",
                    "ascending": true
                },
                {
                    "field_name": "animal description (with N)",
                    "ascending": true
                },
                {
                    "field_name": "low_dose",
                    "ascending": true
                },
                {
                    "field_name": "response units",
                    "ascending": true
                },
                {
                    "field_name": "sex",
                    "ascending": true
                },
                {
                    "field_name": "endpoint id",
                    "ascending": true
                },
                {
                    "field_name": "dose index",
                    "ascending": true
                }
            ],
            "filters": [
                {
                    "field_name": "---",
                    "quantifier": "contains",
                    "value": ""
                },
                {
                    "field_name": "---",
                    "quantifier": "contains",
                    "value": ""
                }
            ],
            "reference_lines": [
                {
                    "value": null,
                    "line_style": "reference line"
                }
            ],
            "reference_rectangles": [
                {
                    "x1": null,
                    "x2": null,
                    "rectangle_style": "base"
                }
            ],
            "labels": [
                {
                    "text": "",
                    "style": "title",
                    "x": 10,
                    "y": 10,
                    "_style": {
                        "name": "title",
                        "fill": "#000",
                        "rotate": "0",
                        "font-size": "12px",
                        "font-weight": "bold",
                        "text-anchor": "middle",
                        "fill-opacity": 1
                    }
                }
            ],
            "row_overrides": [
                {
                    "pk": 46577,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46578,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46579,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46580,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46557,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46558,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46559,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46560,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46561,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style" :"---"
                },
                {
                    "pk": 46562,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46563,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46564,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46565,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46566,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46567,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46568,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46569,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46570,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46571,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46572,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46573,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46574,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46575,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46576,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46581,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46582,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46583,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46584,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46497,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46498,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46483,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46484,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46493,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46494,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46485,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46486,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46491,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46492,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46499,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46500,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46487,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46488,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46489,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46490,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46495,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46496,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46825,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46826,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46525,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46526,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46527,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46528,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46529,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46530,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46531,
                    "include": false,
                    "text_style" :"---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46532,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46533,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46534,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46535,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46536,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46537,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46538,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46539,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46540,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46545,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46546,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46547,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46548,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46549,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46550,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46551,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46552,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46517,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46518,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46519,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46520,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46521,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46522,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46523,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46524,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46501,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46502,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46503,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46504,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46505,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46506,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46507,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46508,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46509,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46510,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46511,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46512,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46513,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46514,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46515,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46516,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46843,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46844,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46845,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46846,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46387,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46388,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46389,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46390,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46391,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46392,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46393,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46394,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46395,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46396,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46397,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46398,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46477,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46478,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46282,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46283,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46284,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46285,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46286,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46287,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46264,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46265,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46266,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46267,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46268,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46269,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46300,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46301,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46302,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46303,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46585,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46586,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46587,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46588,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46589,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46590,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46591,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46592,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46252,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46253,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46254,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46255,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46256,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46257,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46258,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46259,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46260,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46261,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46262,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46263,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style" :"---"
                },
                {
                    "pk": 46270,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46271,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46272,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46273,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46274,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46275,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46276,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46277,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46278,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46279,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style":"---"
                },
                {
                    "pk": 46280,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46281,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46364,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46365,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46366,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46367,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46368,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46479,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46480,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46481,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46482,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46304,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                },
                {
                    "pk": 46305,
                    "include": false,
                    "text_style": "---",
                    "line_style": "---",
                    "symbol_style": "---"
                }
            ],
            "styles": {
                "symbols": [
                    {
                        "name": "base",
                        "type": "circle",
                        "size": 130,
                        "fill": "#000",
                        "fill-opacity": 1,
                        "stroke": "#fff",
                        "stroke-width": 1
                    },
                    {
                        "name": "transparent",
                        "type": "circle",
                        "size": 90,
                        "stroke": "#000000",
                        "fill-opacity": 0,
                        "stroke-width": 0,
                        "fill": "#000000"
                    },
                    {
                        "name": "circle | black",
                        "type": "circle",
                        "size": 90,
                        "stroke": "#000000",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#000000"
                    },
                    {
                        "name": "circle | red",
                        "type": "circle",
                        "size": 90,
                        "stroke": "#6f0000",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#e32727"
                    },
                    {
                        "name": "circle | green",
                        "type": "circle",
                        "size": 90,
                        "stroke": "#006a1e",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#22ba53"
                    },
                    {
                        "name": "circle | blue",
                        "type": "circle",
                        "size": 90,
                        "stroke": "#006dbe",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#3aa4e5"
                    },
                    {
                        "name": "circle | orange",
                        "type": "circle",
                        "size": 90,
                        "stroke": "#dc8f00",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#ffb100"
                    },
                    {
                        "name": "circle | purple",
                        "type": "circle",
                        "size": 90,
                        "stroke": "#5e5e5e",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#b82cff"
                    },
                    {
                        "name": "circle | fuschia",
                        "type": "circle",
                        "size": 90,
                        "stroke": "#ab006c",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#d4266e"
                    },
                    {
                        "name": "triangle up | black",
                        "type": "triangle-up",
                        "size": 90,
                        "stroke": "#000000",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#000000"
                    },
                    {
                        "name": "triangle up | red",
                        "type": "triangle-up",
                        "size": 90,
                        "stroke": "#6f0000",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#e32727"
                    },
                    {
                        "name": "triangle up | green",
                        "type": "triangle-up",
                        "size": 90
                        ,"stroke": "#006a1e"
                        ,"fill-opacity": 0.8
                        ,"stroke-width": 2,
                        "fill": "#22ba53"
                    }
                    ,{
                        "name": "triangle up | blue",
                        "type": "triangle-up",
                        "size": 90,
                        "stroke": "#006dbe",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#3aa4e5"
                    },
                    {
                        "name": "triangle up | orange",
                        "type": "triangle-up",
                        "size": 90,
                        "stroke": "#dc8f00",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#ffb100"
                    },
                    {
                        "name": "triangle up | purple",
                        "type": "triangle-up",
                        "size": 90,
                        "stroke": "#5e5e5e",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#b82cff"
                    },
                    {
                        "name": "triangle up | fuschia",
                        "type": "triangle-up",
                        "size": 90,
                        "stroke": "#ab006c",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#d4266e"
                    },
                    {
                        "name": "triangle down | black",
                        "type": "triangle-down",
                        "size": 90,
                        "stroke": "#000000",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#000000"
                    },
                    {
                        "name": "triangle down | red",
                        "type": "triangle-down",
                        "size": 90,
                        "stroke": "#6f0000",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#e32727"
                    },
                    {
                        "name": "triangle down | green",
                        "type": "triangle-down",
                        "size": 90,
                        "stroke": "#006a1e",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#22ba53"
                    },
                    {
                        "name": "triangle down | blue",
                        "type": "triangle-down",
                        "size": 90,
                        "stroke": "#006dbe",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#3aa4e5"
                    },
                    {
                        "name": "triangle down | orange",
                        "type": "triangle-down",
                        "size": 90,
                        "stroke": "#dc8f00",
                        "fill-opacity" :0.8,
                        "stroke-width": 2,
                        "fill": "#ffb100"
                    },
                    {
                        "name": "triangle down | purple",
                        "type": "triangle-down",
                        "size": 90,
                        "stroke": "#5e5e5e",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#b82cff"
                    },
                    {
                        "name": "triangle down | fuschia",
                        "type": "triangle-down",
                        "size": 90,
                        "stroke": "#ab006c",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#d4266e"
                    },
                    {
                        "name": "diamond | black",
                        "type": "diamond",
                        "size": 90,
                        "stroke": "#000000",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#000000"
                    },
                    {
                        "name": "diamond | red",
                        "type": "diamond",
                        "size": 90,
                        "stroke": "#6f0000",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#e32727"
                    },
                    {
                        "name": "diamond | green",
                        "type": "diamond",
                        "size": 90,
                        "stroke": "#006a1e",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#22ba53"
                    },
                    {
                        "name": "diamond | blue",
                        "type": "diamond",
                        "size": 90,
                        "stroke": "#006dbe",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#3aa4e5"
                    },
                    {
                        "name": "diamond | orange",
                        "type": "diamond",
                        "size": 90,
                        "stroke": "#dc8f00",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#ffb100"
                    },
                    {
                        "name": "diamond | purple",
                        "type": "diamond",
                        "size": 90,
                        "stroke": "#5e5e5e",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#b82cff"
                    },
                    {
                        "name": "diamond | fuschia",
                        "type": "diamond",
                        "size": 90,
                        "stroke": "#ab006c",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#d4266e"
                    },
                    {
                        "name": "square | black",
                        "type": "square",
                        "size": 90,
                        "stroke" :"#000000",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#000000"
                    },
                    {
                        "name": "square | red",
                        "type": "square",
                        "size": 90,
                        "stroke": "#6f0000",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#e32727"
                    },
                    {
                        "name": "square | green",
                        "type": "square",
                        "size": 90,
                        "stroke": "#006a1e",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#22ba53"
                    },
                    {
                        "name": "square | blue",
                        "type": "square",
                        "size": 90,
                        "stroke": "#006dbe",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#3aa4e5"
                    },
                    {
                        "name": "square | orange",
                        "type": "square",
                        "size": 90,
                        "stroke": "#dc8f00",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#ffb100"
                    },
                    {
                        "name": "square | purple",
                        "type": "square",
                        "size": 90,
                        "stroke": "#5e5e5e",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#b82cff"
                    },
                    {
                        "name": "square | fuschia",
                        "type": "square",
                        "size": 90,
                        "stroke": "#ab006c",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#d4266e"
                    },
                    {
                        "name": "cross | black",
                        "type": "cross",
                        "size": 90,
                        "stroke": "#000000",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#000000"
                    },
                    {
                        "name": "cross | red",
                        "type": "cross",
                        "size": 90,
                        "stroke": "#6f0000",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#e32727"
                    },
                    {
                        "name": "cross | green",
                        "type": "cross",
                        "size": 90,
                        "stroke": "#006a1e",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#22ba53"
                    },
                    {
                        "name": "cross | blue",
                        "type": "cross",
                        "size": 90,
                        "stroke": "#006dbe",
                        "fill-opacity": 0.8,
                        "stroke-width" :2,
                        "fill": "#3aa4e5"
                    },
                    {
                        "name": "cross | orange",
                        "type": "cross",
                        "size": 90,
                        "stroke": "#dc8f00",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#ffb100"
                    },
                    {
                        "name": "cross | purple",
                        "type": "cross",
                        "size": 90,
                        "stroke": "#5e5e5e",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#b82cff"
                    },
                    {
                        "name": "cross | fuschia",
                        "type": "cross",
                        "size": 90,
                        "stroke": "#ab006c",
                        "fill-opacity": 0.8,
                        "stroke-width": 2,
                        "fill": "#d4266e"
                    }
                ],
                "lines": [
                    {
                        "name": "base",
                        "stroke": "#708090",
                        "stroke-dasharray": "none",
                        "stroke-opacity": 0.9,
                        "stroke-width": 3
                    },
                    {
                        "name": "reference line",
                        "stroke": "#000000",
                        "stroke-dasharray": "none",
                        "stroke-opacity": 0.8,
                        "stroke-width": 2
                    },
                    {
                        "name": "transparent",
                        "stroke": "#000000",
                        "stroke-dasharray": "none",
                        "stroke-opacity": 0,
                        "stroke-width": 0
                    },
                    {
                        "name": "solid | black",
                        "stroke": "#000000",
                        "stroke-dasharray": "none",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "solid | red",
                        "stroke": "#e32727",
                        "stroke-dasharray": "none",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "solid | green",
                        "stroke": "#006a1e",
                        "stroke-dasharray": "none",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "solid | blue",
                        "stroke": "#006dbe",
                        "stroke-dasharray": "none",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "solid | orange",
                        "stroke": "#dc8f00",
                        "stroke-dasharray": "none"
                        ,"stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "solid | purple",
                        "stroke": "#b82cff",
                        "stroke-dasharray": "none",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "solid | fuschia",
                        "stroke": "#ab006c",
                        "stroke-dasharray": "none",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dashed | black",
                        "stroke": "#000000",
                        "stroke-dasharray": "10, 10",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dashed | red",
                        "stroke": "#e32727",
                        "stroke-dasharray": "10, 10",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dashed | green",
                        "stroke": "#006a1e",
                        "stroke-dasharray": "10, 10",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dashed | blue",
                        "stroke": "#006dbe",
                        "stroke-dasharray": "10, 10",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dashed | orange",
                        "stroke": "#dc8f00",
                        "stroke-dasharray": "10, 10",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dashed | purple",
                        "stroke": "#b82cff",
                        "stroke-dasharray": "10, 10",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dashed | fuschia",
                        "stroke": "#ab006c",
                        "stroke-dasharray": "10, 10",
                        "stroke-opacity" :0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dotted | black",
                        "stroke": "#000000",
                        "stroke-dasharray": "2, 3",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dotted | red",
                        "stroke": "#e32727",
                        "stroke-dasharray": "2, 3",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dotted | green",
                        "stroke": "#006a1e",
                        "stroke-dasharray": "2, 3",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dotted | blue",
                        "stroke": "#006dbe",
                        "stroke-dasharray": "2, 3",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dotted | orange",
                        "stroke": "#dc8f00",
                        "stroke-dasharray": "2, 3",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dotted | purple",
                        "stroke": "#b82cff",
                        "stroke-dasharray": "2, 3",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dotted | fuschia",
                        "stroke": "#ab006c",
                        "stroke-dasharray": "2, 3",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dash-dotted | black",
                        "stroke": "#000000",
                        "stroke-dasharray": "15, 10, 5, 10",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dash-dotted | red",
                        "stroke": "#e32727",
                        "stroke-dasharray": "15, 10, 5, 10",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dash-dotted | green",
                        "stroke": "#006a1e",
                        "stroke-dasharray": "15, 10, 5, 10",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dash-dotted | blue",
                        "stroke": "#006dbe",
                        "stroke-dasharray": "15, 10, 5, 10",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dash-dotted | orange",
                        "stroke": "#dc8f00",
                        "stroke-dasharray": "15, 10, 5, 10",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dash-dotted | purple",
                        "stroke": "#b82cff",
                        "stroke-dasharray": "15, 10, 5, 10",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    },
                    {
                        "name": "dash-dotted | fuschia",
                        "stroke": "#ab006c",
                        "stroke-dasharray": "15, 10, 5, 10",
                        "stroke-opacity": 0.9,
                        "stroke-width": 2
                    }
                ],
                "texts": [
                    {
                        "name": "base",
                        "fill": "#000",
                        "rotate": "0",
                        "font-size": "12px",
                        "font-weight": "normal",
                        "text-anchor": "start",
                        "fill-opacity": 1
                    },
                    {
                        "name": "header",
                        "fill": "#000",
                        "rotate": "0",
                        "font-size": "12px",
                        "font-weight": "bold",
                        "text-anchor": "middle",
                        "fill-opacity": 1
                    },
                    {
                        "name": "title",
                        "fill": "#000",
                        "rotate": "0",
                        "font-size": "12px",
                        "font-weight": "bold",
                        "text-anchor": "middle",
                        "fill-opacity": 1
                    },
                    {
                        "name": "transparent",
                        "font-size": "12px",
                        "rotate": "0",
                        "font-weight": "normal",
                        "text-anchor": "start",
                        "fill": "#000000",
                        "fill-opacity": 0
                    },
                    {
                        "name": "normal | black",
                        "font-size": "12px",
                        "rotate": "0",
                        "font-weight": "normal",
                        "text-anchor": "start",
                        "fill": "#000000",
                        "fill-opacity": 1
                    },
                    {
                        "name": "normal | red",
                        "font-size": "12px",
                        "rotate": "0",
                        "font-weight": "normal",
                        "text-anchor": "start",
                        "fill": "#6f0000",
                        "fill-opacity": 1
                    },
                    {
                        "name": "normal | green",
                        "font-size": "12px",
                        "rotate": "0",
                        "font-weight": "normal",
                        "text-anchor": "start",
                        "fill": "#006a1e",
                        "fill-opacity": 1
                    },
                    {
                        "name": "normal | blue",
                        "font-size": "12px",
                        "rotate": "0",
                        "font-weight": "normal",
                        "text-anchor": "start",
                        "fill": "#006dbe",
                        "fill-opacity": 1
                    },
                    {
                        "name": "normal | orange",
                        "font-size": "12px",
                        "rotate": "0",
                        "font-weight": "normal",
                        "text-anchor": "start",
                        "fill": "#dc8f00",
                        "fill-opacity": 1
                    },
                    {
                        "name": "normal | purple",
                        "font-size": "12px",
                        "rotate": "0",
                        "font-weight": "normal",
                        "text-anchor": "start",
                        "fill": "#b82cff",
                        "fill-opacity": 1
                    },
                    {
                        "name": "normal | fuschia",
                        "font-size": "12px",
                        "rotate": "0",
                        "font-weight": "normal",
                        "text-anchor": "start",
                        "fill": "#ab006c",
                        "fill-opacity": 1
                    },
                    {
                        "name": "header middle alignment",
                        "fill": "#000000",
                        "rotate": "0",
                        "font-size": "12px",
                        "font-weight": "bold",
                        "text-anchor": "start",
                        "fill-opacity": "1"
                    },
                    {
                        "name": "base middle",
                        "fill": "#000000",
                        "rotate": "0",
                        "font-size": "12px",
                        "font-weight": "normal",
                        "text-anchor": "start",
                        "fill-opacity": "1"
                    }
                ],
                "rectangles": [
                    {
                        "name": "base",
                        "fill": "#999999",
                        "stroke": "#000000",
                        "fill-opacity": 0.8,
                        "stroke-width": 1
                    },
                    {
                        "name": "black",
                        "fill": "#000000",
                        "fill-opacity": 0.8,
                        "stroke": "#FFFFFF",
                        "stroke-width": 1
                    },
                    {
                        "name": "red",
                        "fill": "#e32727",
                        "fill-opacity" :0.8,
                        "stroke": "#6f0000",
                        "stroke-width": 1
                    },
                    {
                        "name": "green",
                        "fill": "#22ba53",
                        "fill-opacity": 0.8,
                        "stroke": "#006a1e",
                        "stroke-width": 1
                    },
                    {
                        "name": "blue",
                        "fill": "#3aa4e5",
                        "fill-opacity": 0.8,
                        "stroke": "#006dbe",
                        "stroke-width": 1
                    },
                    {
                        "name": "orange",
                        "fill": "#ffb100",
                        "fill-opacity": 0.8,
                        "stroke": "#dc8f00",
                        "stroke-width": 1
                    },
                    {
                        "name": "purple",
                        "fill": "#b82cff",
                        "fill-opacity": 0.8,
                        "stroke": "#5e5e5e",
                        "stroke-width": 1
                    },
                    {
                        "name": "fuschia",
                        "fill": "#d4266e",
                        "fill-opacity": 0.8,
                        "stroke": "#ab006c",
                        "stroke-width": 1
                    }
                ]
            }
        };

        // Initialize the top-level objects for this EvidenceProfile
        EvidenceProfile.configuration = {};
        EvidenceProfile.object = {};

        // This defines the object attributes' names (key) and data types (value)
        let objectAttributes = {
            title: "string",
            slug: "string",
            settings: "object",
            caption: "string",
            cross_stream_conclusions: "object",
            streams: "array",
        };

        if (typeof(configuration) === "object") {
            // The configuration argument is an object, save it for later use
            EvidenceProfile.configuration = configuration;

            if (typeof(object) === "object") {
                // The object argument is an object, iterate through it to build this object's object attribute

                for (let attributeName in objectAttributes) {
                    if (
                        (attributeName in object)
                        && (
                            (typeof(object[attributeName]) === objectAttributes[attributeName])
                            || (
                                (objectAttributes[attributeName] === "array")
                                && (Array.isArray(object[attributeName]))
                            )
                        )
                    ) {
                        // The object argument has the desired attribute name, and the attribute is of the desired type, copy it to this
                        // object's object attribute
                        EvidenceProfile.object[attributeName] = object[attributeName];
                    }
                    else {
                        // The object argument does not have the desired attribute name, or it is not of the desired type, set an empty counterpart
                        // in this object's object attribute

                        switch (objectAttributes[attributeName]) {
                            case "string":
                                // The attribute should be a string
                                EvidenceProfile.object[attributeName] = "";
                                break;
                            case "object":
                                // The attribute should be an object
                                EvidenceProfile.object[attributeName] = {};
                                break;
                            case "array":
                                // The attribute should be an array
                                EvidenceProfile.object[attributeName] = [];
                                break;
                            default:
                                // The desired type was not handled (e.g. a number), set the object's attribute to null
                                EvidenceProfile.object[attributeName] = null;
                        }
                    }
                }
            }
        }
        else {
            // The configuration argument is not an object, set this object's configuration and object attributes to null
            EvidenceProfile.configuration = null;
            EvidenceProfile.object = null;
        }

        if ((EvidenceProfile.object !== null) && ("streams" in EvidenceProfile.object) && (EvidenceProfile.object.streams.length > 0)) {
            // One or more streams were provided as part of the object argument, convert each simple stream object into a formal
            // EvidenceProfileStream object
            let originalStreams = EvidenceProfile.object.streams;
            EvidenceProfile.object.streams = [];

            // Iterate through each of the original simple objects and use them as the incoming arguments for the EvidenceProfileStream
            // object's contructor
            let iTo = originalStreams.length;
            for (let i=0; i<iTo; i++) {
                EvidenceProfile.object.streams.push(new EvidenceProfileStream(originalStreams[i]));
            }
        }
    }

    // This function builds the formset for the "Evidence Profile Streams" portion of the Evidence Profile form
    static buildEvidenceProfileStreamsFormset() {
        renderEvidenceProfileStreamsFormset(EvidenceProfile.object.streams, EvidenceProfile.configuration.form, EvidenceProfile.configuration.streams);
    }

    // This function builds the formset for the "Cross-Stream Inferences" portion of the Evidence Profile form
    static buildCrossStreamInferencesFormset() {
        renderCrossStreamInferencesFormset(EvidenceProfile.object.cross_stream_conclusions.inferences, EvidenceProfile.configuration.form, EvidenceProfile.configuration.crossStreamInferences);
    }

    // This function builds the D3-based Evidence Profile Table from this.object
    static buildD3Table(divId) {
        if ((divId !== null) && (typeof(divId) === "string") && (divId !== "")) {
            // divId is a non-empty string, see if it matcehes an element in the DOM

            let tableDiv = document.getElementById(divId);
            if (tableDiv !== null) {
                // The expected <div> was found in the document, attempt to build the data object
                let table = new EvidenceProfileTable(this.object, tableDiv, this.defaultSettings);
            }
        }
    }
}

// Export an EvidencProfile object as the default object
export default EvidenceProfile;
