function () {
            'use strict';

            var init = function () {

                var slider2 = new rSlider({
                    target: '#slider2',
                    values: [0, 1, 2, 3, 4, 5, 6, '7', 8],
                    range: false,
                    set: [5],
                    tooltip: false,
                    onChange: function (vals) {
                        console.log(vals);
                    }
                });

                var slider3 = new rSlider({
                    target: '#slider3',
                    values: {min: 0, max: 100},
                    step: 10,
                    range: true,
                    set: [10, 40],
                    scale: true,
                    labels: false,
                    onChange: function (vals) {
                        console.log(vals);
                    }
                });

                var slider = new rSlider({
                    target: '#slider',
                    values: {min: 1900, max: 2000},
                    step: 1,
                    range: true,
                    set: [2010, 2013],
                    onChange: function (vals) {
                        console.log(vals);
                    }
                });
            };
            window.onload = init;
        })();
