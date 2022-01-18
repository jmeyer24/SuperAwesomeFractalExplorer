# SuperAwesomeFractalExplorer
In short: SAFE

## Version

2021-11-15: Mandelbrot Explorer
2021-11-26: Small Mandelbrot and Koch Explorer
2021-12-21: 2D/3D Fractal Displayer

## TODOs

Here we can list the TODOs for future implementation goals

### Main

* controls on shader (mainly mouse, arrows as second option)
* enableDamping for orbit controls

* controls
	+ move around: arrow keys [improve or delete] or ~~mouse drag~~ - note: zoom dependenance
	+ scroll wheel to zoom in/out
	+ ~~no zoom when cursor is inside settings menu~~
	+ limit zoom in (before pixel level) and zoom out (default zoom)
* auto-zoom function
* auto-rotate function

* screenshot tool
	+ implement save and (re)load buttons
	+ optional: save zoom and position of camera
	+ optional: load by previously saved image the respective zoom position again (via name or how?)

* option for color range/scale for multiple colors
* colors:
	+ one color tone possible
	+ change specific colors

### Optional

* take a look at XAOS Fractal Zoomer?!
* save (time dependend) self-controlled video
* window resizing with good layout(!)
* make settings menu responsive (resizing)

## Done

* init function for html element references:
	+ set changeColorScaleOnScroll to value of html element
	+ set iterations to value of html element
* snowflake as shader not mesh
* connect iteration-slider to snowflake
* display different fractals (Mandelbrot, Kochsnowflake, etc.)
* ~~mandelbrot is scewed, head is scewed~~
* interactive color palette for individual design
* change number of iterations of fractal process

## Questions

* iteration-max specified or "your fractal is loading..."
	+ Answer: specify max which lies over real-time usage, color to mark optimum

## Setup

In the file "Setup and Learning/assignment1_SS21.pdf" there is an explanation of the setup for using "npm" and the localhost (e.g. the environment setup)

In the respective folders with the name "Setup..." you can find different setups of Three.js usages
These were part of the Lecture "Scientific Visualization" from Jun.Prof. Michael Krone in Summersemester 2021, only for learning purposes, no distribution

## Appendix and Credits

The Mandelbrot Explorer is initially taken from the source code of the following website:
https://medium.com/@SereneBiologist/rendering-escape-fractals-in-three-js-68c96b385a49
https://austeretriceratops.github.io/EscapeFractal/

Didn't really understand all the folding of the space, but hey, helps with the snowflake anyway
https://www.youtube.com/watch?v=il_Qg9AqQkE
