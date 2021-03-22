export function validateName (name: string) {
  return name.length > 1
}

export function validateEmail (email: string) {
    var regex = /^(\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*\s*[,]?\b)*$/;
    return email.length <= 150 && regex.test(email);
}