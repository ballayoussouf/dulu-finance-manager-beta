/*
  # Ajout d'une fonction pour vérifier l'existence d'un numéro de téléphone

  1. Nouvelle fonction
    - `check_phone_exists`
      - Prend un paramètre `phone_param` de type text
      - Retourne un objet avec un champ `exists` de type boolean
      - Vérifie si le numéro de téléphone existe déjà dans la table users

  2. Sécurité
    - La fonction est accessible à tous les utilisateurs
*/

-- Créer la fonction pour vérifier l'existence d'un numéro de téléphone
CREATE OR REPLACE FUNCTION public.check_phone_exists(phone_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  phone_exists boolean;
  result json;
BEGIN
  -- Vérifier si le numéro existe
  SELECT EXISTS(
    SELECT 1 FROM public.users WHERE phone = phone_param
  ) INTO phone_exists;
  
  -- Construire le résultat JSON
  result := json_build_object('exists', phone_exists);
  
  RETURN result;
END;
$$;

-- Accorder les permissions d'exécution à tous les utilisateurs
GRANT EXECUTE ON FUNCTION public.check_phone_exists(text) TO public;

-- Commentaire pour documenter la fonction
COMMENT ON FUNCTION public.check_phone_exists(text) IS 'Vérifie si un numéro de téléphone existe déjà dans la table users';