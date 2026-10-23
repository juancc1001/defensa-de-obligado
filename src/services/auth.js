import { supabase } from './supabase.js';

// The editors need a logged in user to write to Supabase (a shared user created in the Supabase dashboard).
// Resolves once logged in; the session is kept in localStorage.
export async function requireLogin() {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (data.session) return;

  const form = document.createElement('form');
  form.id = 'login';
  form.innerHTML = `
    <h3>Ingresá para editar</h3>
    <p><input name="email" type="email" placeholder="email" required /></p>
    <p><input name="password" type="password" placeholder="contraseña" required /></p>
    <p><button>Ingresar</button></p>
    <p class="error"></p>`;
  document.body.append(form);

  return new Promise((resolve) => {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const { error } = await supabase.auth.signInWithPassword({ email: form.email.value, password: form.password.value });
      if (error) {
        form.querySelector('.error').textContent = error.message;
        return;
      }
      form.remove();
      resolve();
    };
  });
}
