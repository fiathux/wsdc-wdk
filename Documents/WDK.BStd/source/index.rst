.. WDK.BStd Documention documentation master file, created by
   sphinx-quickstart on Wed Oct  8 01:20:09 2014.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

欢迎使用WDK.BStd文档!
================================================

WDK.BStd是猫为WSDC站开发的一个用于Javascript的基础库和编程框架，它可能不同于你三观中认知的各种
Javascript前端框架，WDK.BStd核心部分只对Javascript语言负责，总体而言它是平台中立的，您可以把它用在
您的浏览器上，也可以用于其他使用Javascript语言的场合（例如 `node.js <http://www.nodejs.org/>`_ ）。
WDK.BStd体积非常小，但是能为开发者提供非常灵便的开发体验，非常易于扩展，也能为逻辑控们提供更加具有
函数式编程（FP）特色的语法形态。

由于在设计上受到了 `Python <http://www.python.org/>`_ 的灵魂侵蚀，猫在WDK.BStd上移植了Python的许多
特性，例如迭代器、range函数、map函数等。但是Javascript终究还是Javascript，猫努力在WDK.BStd保持
Javascript作为魔幻语言的特性，改进了它用于FP编程的体验，并融入了 `JQuery <http://jquery.com/>`_ 的
许多工作习惯，相信您不管是生活在地球上的Oo派开发者，还是存在于火星上的FP逻辑控，WDK.BStd都能给您带
来许多共鸣。

WDK.BStd使用LGPL协议开源，事实上WSDC站的全部框架都将会以GPL或LGPL协议开源，我们的终极目标是要快乐！

现在开始，翻开我们的文档一起享受WDK.BStd编程的乐趣吧～

.. toctree::
   :maxdepth: 2

与之前版本的变化
==================

WDK.BStd的前生——“Wondermask WStdBase”这个名称从当前版本开始不再使用，不仅仅是名称的变化，经历了前几
个版本的试用和探索为WDK.BStd的设计积累了大量的经验，这一次WDK.BStd采用了全新的设计方案，核心代码完
全重写，猫以下例举WDK.BStd最具有代表性的几个变化分享给大家：

1.  与浏览器DOM和BOM相关的所有操作全部从核心抽离，核心部分完全平台中立，抽离的功能全部采用插件实现
2.  WDK.BStd核心可以用自带的工厂方法自由移植和扩展
3.  改进插件机制，新增高阶函数求导功能，植入插件的步骤变得更加简单，插件的结构也更加明晰
4.  大幅增强迭代器的功能，提供更多的惰性求值（Lazy Evaluation）特性，性能小幅提升
5.  map、each等各种枚举方法不再区分“列表”和“迭代器”，可以混用
6.  内核功能可以通过高阶函数的“this”关键字导出，不再完全依赖全局命名空间
7.  代码授权方案由“ `GPL 2.0 <http://www.gnu.org/licenses/old-licenses/gpl-2.0.html>`_ ”改为“
    `LGPL <http://www.gnu.org/licenses/lgpl.html>`_ ”协议，一定程度允许闭源项目集成

索引表
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

