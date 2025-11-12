import { TextField, TextFieldProps, styled } from '@mui/material';

export const CustomInputLargo = styled((props: TextFieldProps) => (
  <TextField
    {...props}
    variant="filled"
    InputProps={{
      disableUnderline: true,
    }}
    InputLabelProps={{
      shrink: true, // Hace que la etiqueta siempre esté arriba
    }}
    multiline
    minRows={1}
  />
))(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(2),
  backgroundColor: '#fff',
  borderRadius: '25px',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  '& .MuiFilledInput-root': {
    borderRadius: '25px',
    backgroundColor: '#fff',
    border: '1px solid #00A7E1',
    padding: '12px 16px',
    fontSize: '0.875rem', // text-sm
    color: '#6F6F6F',
    fontFamily: 'Montserrat, sans-serif',

    '&.Mui-disabled': {
      backgroundColor: '#E5E7EB',
      borderColor: '#9CA3AF',
      color: '#9CA3AF',
      cursor: 'not-allowed',
    },
    '&.Mui-error': {
      borderColor: '#EF4444',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#6F6F6F',
    fontSize: '0.875rem',
    fontFamily: 'Montserrat, sans-serif',
    marginBottom: '16px',
    transform: 'none',
    position: 'static',
  },
  '& .MuiFormHelperText-root': {
    fontSize: '0.875rem',
    marginLeft: '0',
    marginTop: '4px',
    fontFamily: 'Montserrat, sans-serif',
  },
  '& .MuiFormHelperText-root.Mui-error': {
    color: '#EF4444',
  },
}));
