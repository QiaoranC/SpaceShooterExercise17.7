# A exercise work
This is a HTML5 game exercise work by a beginner.
It is original from [galaxian-canvas-game](https://github.com/straker/galaxian-canvas-game).
And mainly followed the [tutorials](http://blog.sklambert.com/html5-canvas-game-panning-a-background/).

This exercise changed the game into a horizontal way from the original vertical way.

The purpose is to let me understand the HTML5 Canvas,
This project may seems small and simply.
However, it including some fascinating techniques object pools, dirty boxing, and multiple canvases, 2D Collision Detection.

Here is the[DEMO](http://htmlpreview.github.com/?https://github.com/QiaoranC/SpaceShooterExercise17.7/blob/master/SpaceShooter.html)

## 横版飞行射击 HTML5 小游戏
初学者，第一次尝试写H5小游戏，根据[教程](http://blog.sklambert.com/html5-canvas-game-panning-a-background/).
主要学习理解教程中的内容，加深对H5的canvas的体验。
把原教程中的竖版游戏规则改写成了横版游戏规则。并替换了合适的贴图。
调整包括背景的移动方式，飞机以及敌人的行为模式。
虽然游戏简单，但是包含了一些有趣的算法和设计，适用与扩展成为更大项目，包括
*对象池 （object pools）： 回收利用旧的目标（玩家的子弹），而不是直接删除再创造目标。
*脏矩形绘制 （Dirty Rectangles）: 只更改目标的一小部分，而不是整体重绘，如果子弹已经离开屏幕，会返回true，准备好再利用，否则取消。
*2D碰撞检测 （2D Collision Detection）：利用空间划的四叉树算法来进行碰撞检测，这样当出现几十个或更多的目标时，有一定距离的目标就不会出现是否碰撞的判定。

详情可见[博客](http://blog.csdn.net/qiaoranc/article/details/76539907)
利用了H5的原生canvas特性。
