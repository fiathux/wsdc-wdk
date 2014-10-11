(function(){
    function setDollar(){ window.$=window._GWonder; return true; }
    function setShiftDollar(){ window._$=window._GWonder; return true; }
    (_GWonder.isNone(window.$) && setDollar()) || setShiftDollar();
})();
