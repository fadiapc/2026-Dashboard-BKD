using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace WebApi.Middleware
{
    public class ResourceOwnerRequiredAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var userId = context.HttpContext.User.FindFirstValue("id");
            
            if (userId == null) {
                context.Result = new UnauthorizedObjectResult(new { Message = "Login required" });
                return;
            }
            var routeId = context.ActionArguments["id"];
            if (routeId?.ToString() != userId && context.HttpContext.User.FindFirstValue("role") != "admin")
            {
                context.Result = new ForbidResult();
                return;
            }

            base.OnActionExecuting(context);
        }
    }
}