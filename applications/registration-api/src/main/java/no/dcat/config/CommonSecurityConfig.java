package no.dcat.config;

/*
@Configuration
@EnableWebSecurity
@Order(SecurityProperties.BASIC_AUTH_ORDER -15)
public class CommonSecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {

        // @formatter:off
        http
           .httpBasic()
                .disable()
           .csrf()
                .disable()
                    .anonymous()
                .and()
           .authorizeRequests()
                .antMatchers("/*.js").permitAll()
                .antMatchers("/*.woff2").permitAll()
                .antMatchers("/*.woff").permitAll()
                .antMatchers("/*.ttf").permitAll()
                .antMatchers("/assets/**").permitAll()
                .antMatchers("/loggetut").permitAll()
                .antMatchers("/loginerror").permitAll()
                .and()

           .authorizeRequests()
                .antMatchers(HttpMethod.GET,"/catalogs/**").permitAll()
                //.anyRequest().authenticated()
                .and()
           .exceptionHandling()
                .accessDeniedPage("/loginerror");
        // @formatter:on
    }

}
*/