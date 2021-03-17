var x = window.matchMedia("(max-width:900px)");
if (x.matches) {
  $("#toggle").click(function () {
    $(".dropdown").css("width", "50%");
  });
  $("#tog").click(function () {
    $(".dropdown").css("width", "0%");
  });
  $(".iconLogo").after($(".signCart"));

  $(".jvCardCart button").remove();
}

$(".jvCard").mouseover(function () {
  $(this).find(".jvCardCart button").css("display", "block");
  $(this).addClass("shadow");
});
$(".jvCard").mouseout(function () {
  $(this).find(".jvCardCart button").css("display", "none");
  $(this).removeClass("shadow");
});


$(".proCol20 img").click(function(){
  let thisSrc=$(this).attr('src');
$("#expandedImg").attr('src',thisSrc);
$(".active").removeClass("active");
$(this).addClass("active");
});
