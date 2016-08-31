$(function(){
	lrFixFooter("div.loginfoot");	//调用方法：lrFixFooter("div.footerwarp"); 传入底部的类名或者ID名
	
	function lrFixFooter(obj){
		var footer = $(obj),doc = $(document);
		function fixFooter(){
			if(doc.height()-4 <= $(window).height()){
				footer.css({
					width:"100%",
					position:"absolute",
					left:0,
					bottom:0	
				});
			}else{
				footer.css({
					position:"static"
				});
			}
		}
		fixFooter();
		$(window).on('resize.footer', function(){
			fixFooter();
		});
		$(window).on('scroll.footer',function(){
			fixFooter();
		});	
	}

	$('.loginbtn01').keydown(function(e){
		var upwd = $('#upwd').val();
		var regex = /^[A-Za-z0-9\.\_\-]{3,20}$/i;
		if(regex.test($.trim(upwd))){
			if(e.keyCode == 13 && !$('#loginBtn').attr("disabled")) {
				submitMethod();
			}
		}
	});
	
	//如果登陆错误刚显示
	var loginErrMsg = $("#logingErrMsg").html();
	if (loginErrMsg.replace(/\s/g, "")) {
		$("#logingErrMsg").css("display","block");
	}
})

function submitMethod(){
	var uname = $('#userName').val();
	var upwd = $('#upwd').val();
	
	//验证用户名,验证密码
	var regex = /\w+/;
	if( !regex.test($.trim(uname)) || !regex.test($.trim(upwd)) ){
		$("#logingErrMsg").css("display","block");
		$("#logingErrMsg").html("帐号或密码不能为空");
		return;
	}
	
	$("#logingErrMsg").css("display","none");
	$("#logingErrMsg").html("");
	$('#loginBtn').css("width",270);
	$('#loginBtn').attr("disabled", true);
	$('#loginBtn').val('正在登陆中...');
    $("#loginForm").submit(); 
}

function remeberMe(ipt){
	return $(ipt).is(":checked") ? 
			$(ipt).val("1") : $(ipt).val("0");
}
