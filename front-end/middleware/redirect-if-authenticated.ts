export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated } = useStudentAuth();

  if (isAuthenticated.value) {
    return navigateTo("/dashboard");
  }
});
