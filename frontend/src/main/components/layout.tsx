import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from "@mui/material";
import { Menu as MenuIcon, Close as CloseIcon } from "@mui/icons-material";

type LayoutProps = {
  pages: Array<{
    title: string;
    icon?: React.ReactNode;
    url: string;
    component: React.ComponentType;
  }>;
};

export const Layout = ({ pages }: LayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const singlePage = pages.length === 1;

  return (
    <>
      <AppBar
        position="static"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          {!singlePage && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setDrawerOpen((prev) => !prev)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            noWrap
            component="div"
            display="flex"
            alignItems="center"
          >
            <img
              src="/logo1_64.png"
              alt="logo"
              style={{ display: "inline", width: "2em", marginRight: "0.5em" }}
            />
            AReX
          </Typography>
        </Toolbar>
      </AppBar>

      {!singlePage && (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          <Box sx={{ width: 250 }}>
            <Box sx={{ display: "flex", alignItems: "center", padding: 2 }}>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                AReX
              </Typography>
              <IconButton onClick={() => setDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider />
            <List>
              {pages.map((item) => (
                <ListItem key={item.url}>
                  <ListItemButton
                    onClick={() => {
                      setDrawerOpen(false);
                      navigate(item.url);
                    }}
                  >
                    {item.icon ? (
                      <ListItemIcon>{item.icon}</ListItemIcon>
                    ) : null}
                    <ListItemText primary={item.title} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
      )}

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Routes>
          {pages.map((item) => (
            <Route
              key={item.url}
              path={item.url}
              element={<item.component />}
            />
          ))}
          <Route
            path="*"
            element={
              <Typography variant="h6" component="h1" color="textSecondary">
                Page Not Found
              </Typography>
            }
          />
        </Routes>
      </Box>
    </>
  );
};
