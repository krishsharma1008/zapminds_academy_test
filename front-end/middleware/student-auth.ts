type AuthCookieShape = {
  isAuthenticated?: boolean;
};

export default defineNuxtRouteMiddleware(() => {
  const authCookie = useCookie<AuthCookieShape>("za-student-auth", {
    default: () => ({ isAuthenticated: false }),
    watch: false,
  });

  const isAuthenticated = Boolean(authCookie.value?.isAuthenticated);

  if (!isAuthenticated) {
    return navigateTo("/login");
  }
});
