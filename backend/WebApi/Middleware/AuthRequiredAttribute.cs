using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.IdentityModel.Tokens;

namespace WebApi.Middleware
{
    public class AuthRequiredAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            if (context.HttpContext.User.Claims.IsNullOrEmpty())
            {
                context.Result = new UnauthorizedObjectResult(new { Message = "Login required" });
                return;
            }

            base.OnActionExecuting(context);
        }
    }
}